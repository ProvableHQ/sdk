import { logger } from "./utils/logger.js";
import { post, TransportFunction, defaultTransport } from "./utils/utils.js";
import { FIVE_MINUTES } from "./constants.js";

/**
 * Interface for the JWT data.
 *
 * @property jwt {string} The JWT token string.
 * @property expiration {number} The expiration time of the JWT token in UNIX timestamp format (milliseconds).
 */
export interface JWTData {
    jwt: string;
    expiration: number;
}

/** Default header carrying a provisioned API key (e.g. edge.provable.com). */
export const DEFAULT_API_KEY_HEADER = "X-API-Key";

/**
 * Authentication configuration for Provable API services.
 *
 * Two live modes exist, matching the two gateways:
 * - `jwt` (api.provable.com): the apiKey + consumerId pair mints a short-lived JWT at
 *   `/jwts/{consumerId}` which is sent as an `Authorization` header and refreshed near expiry.
 * - `api-key` (edge.provable.com): a provisioned key is sent verbatim on every request in a
 *   header (default `X-API-Key`). There is no registration, minting, or refresh in this mode;
 *   a 401 means the key is invalid or revoked and retrying cannot help.
 * - `none`: requests carry no auth headers.
 */
export type ApiAuthConfig =
    | { mode: "jwt"; apiKey?: string; consumerId?: string; jwtData?: JWTData }
    | { mode: "api-key"; value: string; header?: string }
    | { mode: "none" };

/**
 * Legacy authentication options accepted by {@link AleoNetworkClient} and {@link RecordScanner}
 * before explicit modes existed. Normalized by {@link normalizeAuthConfig}.
 */
export interface LegacyAuthOptions {
    auth?: ApiAuthConfig;
    apiKey?: string | { header: string; value: string };
    consumerId?: string;
    jwtData?: JWTData;
}

/**
 * Normalize legacy auth options into an explicit {@link ApiAuthConfig}.
 *
 * Rules, preserving the pre-mode behavior of both clients:
 * - An explicit `auth` wins. Combining it with legacy fields throws — the caller's intent
 *   is ambiguous and guessing hides misconfiguration.
 * - A string `apiKey` (with or without `consumerId`) or a bare `jwtData` selects `jwt` mode.
 * - An `{ header, value }` apiKey selects `api-key` mode with that header. Combining it with
 *   a `consumerId` throws: keyed auth has no consumer and the pair would silently pick one.
 * - Nothing configured selects `none`.
 */
export function normalizeAuthConfig(options: LegacyAuthOptions): ApiAuthConfig {
    if (options.auth) {
        if (options.apiKey !== undefined || options.consumerId !== undefined || options.jwtData !== undefined) {
            throw new Error("Pass either `auth` or the legacy apiKey/consumerId/jwtData options, not both");
        }
        if (options.auth.mode === "api-key" && !options.auth.value) {
            throw new Error("api-key auth mode requires a key value. Keys are provisioned, not registered — supply one.");
        }
        return options.auth;
    }
    if (typeof options.apiKey === "object" && options.apiKey !== null) {
        if (options.consumerId !== undefined) {
            throw new Error("A custom-header apiKey cannot be combined with consumerId — keyed auth has no consumer. Use a string apiKey for JWT auth.");
        }
        return { mode: "api-key", value: options.apiKey.value, header: options.apiKey.header };
    }
    if (options.apiKey !== undefined || options.consumerId !== undefined || options.jwtData !== undefined) {
        return { mode: "jwt", apiKey: options.apiKey, consumerId: options.consumerId, jwtData: options.jwtData };
    }
    return { mode: "none" };
}

/**
 * ApiAuth resolves the auth headers each request must carry, owning the JWT mint/refresh
 * lifecycle in `jwt` mode. Share one instance across clients that use the same credentials so
 * only one minter exists and concurrent refreshes are deduplicated.
 */
export class ApiAuth {
    readonly config: ApiAuthConfig;
    private readonly baseUrl: string;
    private readonly transport: TransportFunction;
    private jwtData?: JWTData;
    private inFlight?: Promise<JWTData>;
    private warned = false;

    private readonly mintHeaders: Record<string, string>;

    /**
     * @param {ApiAuthConfig} config The auth mode and its material.
     * @param {string} baseUrl API root origin; `/jwts/{consumerId}` lives here in `jwt` mode.
     * @param {TransportFunction} transport Transport used for the JWT mint request.
     * @param {Record<string, string>} [mintHeaders] Extra headers on the mint request (e.g. SDK telemetry).
     */
    constructor(
        config: ApiAuthConfig,
        baseUrl: string,
        transport: TransportFunction = defaultTransport,
        mintHeaders: Record<string, string> = {},
    ) {
        this.config = config;
        this.baseUrl = baseUrl;
        this.transport = transport;
        this.mintHeaders = mintHeaders;
        if (config.mode === "jwt") this.jwtData = config.jwtData;
    }

    /** The mode this instance authenticates with. */
    get mode(): ApiAuthConfig["mode"] {
        return this.config.mode;
    }

    /** Replace the stored JWT, e.g. one minted elsewhere. Only meaningful in `jwt` mode. */
    setJwtData(jwtData: JWTData | undefined) {
        this.jwtData = jwtData;
    }

    /** The stored JWT, when one exists. */
    getJwtData(): JWTData | undefined {
        return this.jwtData;
    }

    /**
     * The auth headers a request must carry, refreshing the JWT first when it is stale and a
     * refresh is possible. Returns an empty object in `none` mode or when `jwt` mode lacks
     * both a usable token and the material to mint one.
     */
    async headers(): Promise<Record<string, string>> {
        if (this.config.mode === "none") return {};
        if (this.config.mode === "api-key") {
            return { [this.config.header ?? DEFAULT_API_KEY_HEADER]: this.config.value };
        }
        const stale = !this.jwtData || Date.now() >= this.jwtData.expiration - FIVE_MINUTES;
        if (stale) {
            const { apiKey, consumerId } = this.config;
            if (apiKey && consumerId) {
                this.inFlight ??= this.refreshJwt(apiKey, consumerId).finally(() => {
                    this.inFlight = undefined;
                });
                this.jwtData = await this.inFlight;
            } else if (!this.jwtData && !this.warned) {
                this.warned = true;
                logger.warn("JWT or both apiKey and consumerId are required when using the Provable API");
            }
            // A stale JWT that cannot be refreshed is still sent: the server is the
            // authority on expiry and rejecting locally would break long-lived callers.
        }
        return this.jwtData?.jwt ? { Authorization: this.jwtData.jwt } : {};
    }

    /**
     * Refreshes the JWT by making a POST request to /jwts/{consumer_id}.
     *
     * @param {string} apiKey The API key to use for the refresh request.
     * @param {string} consumerId The consumer ID for the JWT endpoint.
     * @returns {Promise<JWTData>} The new JWT data.
     */
    private async refreshJwt(apiKey: string, consumerId: string): Promise<JWTData> {
        const response = await post(
            `${this.baseUrl}/jwts/${consumerId}`,
            {
                headers: {
                    ...this.mintHeaders,
                    "X-Provable-API-Key": apiKey,
                },
            },
            this.transport,
        );
        const authHeader = response.headers.get("authorization");
        if (!authHeader) {
            throw new Error("No authorization header in JWT refresh response");
        }
        const body = await response.json();
        return {
            jwt: authHeader,
            expiration: body.exp * 1000, // Convert to milliseconds
        };
    }
}
