import { logger } from "./logger.js";

function detectBrowser() {
    const userAgent = navigator.userAgent;

    if (/chrome|crios|crmo/i.test(userAgent) && !/edge|edg|opr/i.test(userAgent)) {
        return "chrome";
    } else if (/firefox|fxios/i.test(userAgent)) {
        return "firefox";
    } else if (/safari/i.test(userAgent) && !/chrome|crios|crmo|android/i.test(userAgent)) {
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
    return typeof process !== "undefined" &&
    process.versions != null &&
    process.versions.node != null;
}

export function environment() {
    if ((typeof process !== 'undefined') &&
        (process.release?.name === 'node')) {
        return 'node';
    } else if (typeof window !== 'undefined') {
        return detectBrowser();
    } else {
        return 'unknown';
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

/** Default transport — wraps global fetch to avoid illegal-invocation errors in browsers. */
export const defaultTransport: TransportFunction = (...args) => fetch(...args);

/**
 * Build an RFC 6265 `Cookie` request header value from a Response's `Set-Cookie` headers.
 *
 * `Headers.get("set-cookie")` returns a single comma-joined string when a response carries
 * multiple Set-Cookie headers (per WHATWG Fetch). The `Cookie` request header, however,
 * uses `; ` as separator per RFC 6265 §4.2. Forwarding the joined value verbatim produces
 * a malformed header that strict parsers treat as a single cookie with a corrupted value,
 * silently dropping every cookie except the first.
 *
 * This helper reads each Set-Cookie individually via `Headers.getSetCookie()` (Node 22+),
 * or splits the comma-joined `Headers.get("set-cookie")` result on the fallback path for
 * older runtimes. The fallback split breaks only on `", "` followed by a cookie-name
 * token, so commas inside `Expires=Wed, 21 Oct ...` date attributes aren't broken. It
 * then strips response-only attributes (`Path`, `Domain`, `Max-Age`, `Expires`, `Secure`,
 * `HttpOnly`, `SameSite`, ...) which RFC 6265 §5.4 explicitly excludes from the request
 * header, and joins the surviving `name=value` pairs with `; `.
 *
 * Returns `null` on empty so callers can keep the spread idiom:
 * `...(cookie ? { Cookie: cookie } : {})`.
 */
export function cookieFromSetCookies(headers: Headers): string | null {
    let setCookies: string[];
    if (typeof headers.getSetCookie === "function") {
        setCookies = headers.getSetCookie();
    } else {
        const raw = headers.get("set-cookie");
        // Older fetch runtimes comma-join multiple Set-Cookie headers into a
        // single string. Split only on `, ` followed by a likely cookie-name
        // token (`[A-Za-z][\w-]*=`), which excludes commas inside
        // `Expires=Wed, 21 Oct 2015 …` date attributes (the char after the
        // comma there is a digit, not a letter).
        setCookies = raw ? raw.split(/, (?=[A-Za-z][\w-]*=)/) : [];
    }

    const cookieHeader = setCookies
        .map((sc) => sc.split(";")[0].trim()) // drop response-only attributes
        .filter((pair) => pair.length > 0)
        .join("; ");

    return cookieHeader.length > 0 ? cookieHeader : null;
}

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

export async function get(url: URL | string, options?: RequestInit, transport: TransportFunction = defaultTransport) {
    const response = await transport(url, options);

    if (!response.ok) {
        throw new Error(response.status + " could not get URL " + url);
    }

    return response;
}

export async function post(url: URL | string, options: RequestInit, transport: TransportFunction = defaultTransport) {
    options.method = "POST";

    const response = await transport(url, options);

    if (!response.ok) {
        const error = await response.text();
        let message = `${response.status} error received from ${url}`;
        if (error) {
            message = `${error}`
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
