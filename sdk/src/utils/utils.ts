import { logger } from "./logger.js";

function detectBrowser() {
    const userAgent = navigator.userAgent;

    if (
        /chrome|crios|crmo/i.test(userAgent) &&
        !/edge|edg|opr/i.test(userAgent)
    ) {
        return "chrome";
    } else if (/firefox|fxios/i.test(userAgent)) {
        return "firefox";
    } else if (
        /safari/i.test(userAgent) &&
        !/chrome|crios|crmo|android/i.test(userAgent)
    ) {
        return "safari";
    } else if (/edg/i.test(userAgent)) {
        return "edge";
    } else if (/opr\//i.test(userAgent)) {
        return "opera";
    } else {
        return "browser";
    }
}

export function isNode(): boolean {
    return (
        typeof process !== "undefined" &&
        process.versions != null &&
        process.versions.node != null
    );
}

export function environment() {
    if (typeof process !== "undefined" && process.release?.name === "node") {
        return "node";
    } else if (typeof window !== "undefined") {
        return detectBrowser();
    } else {
        return "unknown";
    }
}

export function logAndThrow(message: string): never {
    logger.error(message);
    throw new Error(message);
}

/**
 * A function matching the global `fetch` signature. Consumers can provide
 * their own implementation to inject custom HTTP agents, mTLS certificates,
 * timeouts, or logging.
 */
export type TransportFunction = typeof fetch;

/*
 * Per-origin cookie jar used by `defaultTransport`.
 *
 * Some Aleo backends sit behind a gateway (e.g. Kong) that uses cookie-based
 * session affinity: the server sets a routing cookie on the first response and
 * expects it back on subsequent requests so per-session state stays on the same
 * upstream instance. Browsers and iOS NSURLSession persist cookies automatically,
 * but Node `fetch` and bare React Native do not — without a jar, those runtimes
 * land on a random upstream per request.
 *
 * Only cookies named in `AFFINITY_COOKIE_NAMES` are captured. The jar is
 * module-scoped — the same process shares routing cookies per origin — but the
 * whitelist keeps unrelated cookies (auth, session, CSRF) out of it, so other
 * SDK clients hitting the same origin can't accidentally inherit caller state.
 *
 * In a browser this jar is effectively a no-op: `Cookie` is a forbidden request
 * header, so the manual value set here is dropped by the browser and the
 * browser's own cookie store takes over.
 */
const AFFINITY_COOKIE_NAMES: ReadonlySet<string> = new Set(["route"]);
const cookieJar = new Map<string, Map<string, string>>();

function isRequestLike(value: unknown): value is Request {
    return (
        typeof Request !== "undefined" &&
        value !== null &&
        typeof value === "object" &&
        value instanceof Request
    );
}

function isHeadersLike(value: unknown): value is Headers {
    return (
        typeof Headers !== "undefined" &&
        value !== null &&
        typeof value === "object" &&
        value instanceof Headers
    );
}

function originOf(urlOrReq: URL | string | Request): string | null {
    try {
        const raw =
            typeof urlOrReq === "string"
                ? urlOrReq
                : urlOrReq instanceof URL
                  ? urlOrReq.toString()
                  : isRequestLike(urlOrReq)
                    ? urlOrReq.url
                    : String(urlOrReq);
        const parsed = new URL(raw);
        return `${parsed.protocol}//${parsed.host}`;
    } catch {
        return null;
    }
}

function cookieHeaderFor(origin: string | null): string | null {
    if (!origin) return null;
    const jar = cookieJar.get(origin);
    if (!jar || jar.size === 0) return null;
    const parts: string[] = [];
    for (const [name, value] of jar) parts.push(`${name}=${value}`);
    return parts.join("; ");
}

/*
 * Reads Set-Cookie values from a fetch-style response in a defensive way.
 * Existing test mocks return minimal response-like objects without a
 * `headers` field, and Node's fetch surfaces multiple Set-Cookie headers via
 * `getSetCookie()` (not `get('set-cookie')`, which returns null or a
 * comma-joined string depending on the implementation).
 */
function readSetCookies(response: unknown): string[] {
    if (!response || typeof response !== "object") return [];
    const headers = (response as { headers?: unknown }).headers;
    if (!headers || typeof headers !== "object") return [];
    const getSetCookie = (headers as { getSetCookie?: () => string[] })
        .getSetCookie;
    if (typeof getSetCookie === "function") {
        try {
            const list = getSetCookie.call(headers);
            if (Array.isArray(list) && list.length > 0) return list;
        } catch {
            // fall through to .get()
        }
    }
    const get = (headers as { get?: (name: string) => string | null }).get;
    if (typeof get !== "function") return [];
    let raw: string | null;
    try {
        raw = get.call(headers, "set-cookie");
    } catch {
        return [];
    }
    if (!raw) return [];
    // Some older runtimes comma-join multiple Set-Cookie headers into a
    // single string. Split only when the comma is followed by a likely
    // new cookie name (`alpha[\w-]*=`), which excludes commas inside
    // `Expires=Wed, 21 Oct 2015 …` date attributes.
    return raw.split(/, (?=[A-Za-z][\w-]*=)/);
}

function storeSetCookies(origin: string | null, cookies: string[]) {
    if (!origin || cookies.length === 0) return;
    let jar: Map<string, string> | undefined;
    for (const cookie of cookies) {
        if (typeof cookie !== "string" || !cookie) continue;
        const head = cookie.split(";")[0];
        const eq = head.indexOf("=");
        if (eq <= 0) continue;
        const name = head.slice(0, eq).trim();
        if (!AFFINITY_COOKIE_NAMES.has(name)) continue;
        if (!jar) {
            jar = cookieJar.get(origin);
            if (!jar) {
                jar = new Map();
                cookieJar.set(origin, jar);
            }
        }
        jar.set(name, head.slice(eq + 1).trim());
    }
}

/*
 * Returns a fresh HeadersInit with `cookie` attached when the input doesn't
 * already carry one. NEVER mutates the caller's input — a caller reusing the
 * same Headers/init across calls to different origins must not see origin A's
 * jar cookie persist into the call for origin B.
 */
function attachCookie(
    headersInit: HeadersInit | undefined,
    cookie: string,
): HeadersInit {
    if (isHeadersLike(headersInit)) {
        if (headersInit.has("cookie")) return headersInit;
        const cloned = new Headers(headersInit);
        cloned.set("cookie", cookie);
        return cloned;
    }
    if (Array.isArray(headersInit)) {
        const hasCookie = headersInit.some(
            (pair) =>
                Array.isArray(pair) &&
                typeof pair[0] === "string" &&
                pair[0].toLowerCase() === "cookie",
        );
        return hasCookie ? headersInit : [...headersInit, ["cookie", cookie]];
    }
    if (headersInit && typeof headersInit === "object") {
        const hasCookie = Object.keys(headersInit).some(
            (key) => key.toLowerCase() === "cookie",
        );
        return hasCookie ? headersInit : { ...headersInit, cookie };
    }
    return { cookie };
}

/**
 * Default transport used by SDK HTTP helpers.
 *
 * Wraps the global `fetch` (avoiding illegal-invocation errors in browsers when
 * `fetch` is passed around as a bare reference) and layers a per-origin cookie
 * jar on top. Responses' `Set-Cookie` headers are captured (filtered by
 * `AFFINITY_COOKIE_NAMES`) and replayed as a `Cookie` header on subsequent
 * same-origin requests, which is required for backends that use cookie-based
 * session affinity (see `cookieJar` above).
 *
 * A caller-supplied `Cookie` header is never overwritten — `network-client.ts`
 * forwards the pubkey-response cookie manually onto delegated-prove requests
 * for Node compatibility, and that path takes precedence over the jar.
 */
export const defaultTransport: TransportFunction = async (input, init) => {
    const origin = originOf(input as URL | string | Request);
    const cookie = cookieHeaderFor(origin);
    if (cookie) {
        // Always operate on shallow clones so callers reusing the same
        // `init` / `Headers` / `Request` across origins don't end up with
        // origin A's jar cookie persisting into the object and blocking
        // origin B's correct cookie.
        if (init?.headers !== undefined && init.headers !== null) {
            // init.headers, when explicitly set, REPLACES the Request's
            // headers per the Fetch spec — attach there.
            init = { ...init, headers: attachCookie(init.headers, cookie) };
        } else if (isRequestLike(input)) {
            // Merge the Request's existing headers with the cookie and
            // pass them via `init.headers` instead of mutating the
            // Request itself. (Fetch spec: an explicit `init.headers`
            // replaces Request.headers entirely, so we copy the
            // originals into the merged set first.)
            try {
                const merged = new Headers(input.headers);
                if (!merged.has("cookie")) {
                    merged.set("cookie", cookie);
                    init = { ...(init ?? {}), headers: merged };
                }
            } catch {
                // Some runtimes restrict Headers construction from a
                // Request; skip rather than failing the request.
            }
        } else if (init) {
            init = { ...init, headers: attachCookie(undefined, cookie) };
        } else {
            init = { headers: attachCookie(undefined, cookie) };
        }
    }
    const response = await fetch(input as RequestInfo, init);
    storeSetCookies(origin, readSetCookies(response));
    return response;
};

export function parseJSON(json: string): any {
    function revive(key: string, value: any, context: any) {
        if (Number.isInteger(value)) {
            return BigInt(context.source);
        } else {
            return value;
        }
    }

    return JSON.parse(json, revive as any);
}

export async function get(
    url: URL | string,
    options?: RequestInit,
    transport: TransportFunction = defaultTransport,
) {
    const response = await transport(url, options);

    if (!response.ok) {
        throw new Error(response.status + " could not get URL " + url);
    }

    return response;
}

export async function post(
    url: URL | string,
    options: RequestInit,
    transport: TransportFunction = defaultTransport,
) {
    options.method = "POST";

    const response = await transport(url, options);

    if (!response.ok) {
        const error = await response.text();
        let message = `${response.status} error received from ${url}`;
        if (error) {
            message = `${error}`;
        }
        throw new Error(message);
    }

    return response;
}

type RetryOptions = {
    maxAttempts?: number;
    baseDelay?: number;
    jitter?: number;
    retryOnStatus?: number[]; // e.g. [500, 502, 503]
    shouldRetry?: (err: any) => boolean;
};

export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    {
        maxAttempts = 5,
        baseDelay = 100,
        jitter,
        retryOnStatus = [],
        shouldRetry,
    }: RetryOptions = {},
): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (err: any) {
            const isLast = attempt === maxAttempts;
            const error = err as Error & { code?: string; status?: number };

            let retryable = false;

            if (typeof error.status === "number") {
                if (error.status >= 500) {
                    retryable = true;
                } else if (error.status >= 400 && shouldRetry) {
                    retryable = shouldRetry(error);
                }
            } else if (shouldRetry) {
                retryable = shouldRetry(error);
            }

            if (!retryable || isLast) throw error;

            const jitterAmount = jitter ?? baseDelay;
            const actualJitter = Math.floor(Math.random() * jitterAmount);
            const delay = baseDelay * 2 ** (attempt - 1) + actualJitter;
            logger.warn(
                `Retry ${attempt}/${maxAttempts} failed. Retrying in ${delay}ms...`,
            );

            await new Promise((res) => setTimeout(res, delay));
        }
    }

    throw new Error("retryWithBackoff: unreachable");
}
