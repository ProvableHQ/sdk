export function logAndThrow(message: string): never {
    console.error(message);
    throw new Error(message);
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

export async function get(url: URL | string, options?: RequestInit) {
    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(response.status + " could not get URL " + url);
    }

    return response;
}

export async function post(url: URL | string, options: RequestInit) {
    options.method = "POST";

    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(response.status + " could not post URL " + url);
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
            console.warn(
                `Retry ${attempt}/${maxAttempts} failed. Retrying in ${delay}ms...`,
            );

            await new Promise((res) => setTimeout(res, delay));
        }
    }

    throw new Error("retryWithBackoff: unreachable");
}
