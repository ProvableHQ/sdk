type RetryOptions = {
  maxAttempts?: number;
  baseDelay?: number;
  jitter?: number;
  retryOnStatus?: number[];
  shouldRetry?: (err: unknown) => boolean;
};

export function parseJSON<T = unknown>(json: string): T {
  function revive(_key: string, value: unknown, context: { source: string }): unknown {
    if (Number.isInteger(value)) {
      try {
        return BigInt(context.source);
      } catch (_error) {
        return value;
      }
    }
    return value;
  }

  return JSON.parse(json, revive as (key: string, value: unknown) => unknown);
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  { maxAttempts = 5, baseDelay = 100, jitter, retryOnStatus = [], shouldRetry }: RetryOptions = {}
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isLast = attempt === maxAttempts;
      const error = err as Error & { status?: number };
      let retryable = false;

      if (typeof error.status === "number") {
        if (error.status >= 500) {
          retryable = true;
        } else if (error.status >= 400 && shouldRetry) {
          retryable = shouldRetry(error);
        } else if (retryOnStatus.includes(error.status)) {
          retryable = true;
        }
      } else if (shouldRetry) {
        retryable = shouldRetry(error);
      }

      if (!retryable || isLast) {
        throw error;
      }

      const jitterAmount = jitter ?? baseDelay;
      const actualJitter = Math.floor(Math.random() * jitterAmount);
      const delay = baseDelay * 2 ** (attempt - 1) + actualJitter;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("retryWithBackoff: unreachable");
}
