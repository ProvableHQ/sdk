function detectBrowser(): string {
  if (typeof navigator === "undefined") {
    return "unknown";
  }

  const userAgent = navigator.userAgent || "";

  if (/chrome|crios|crmo/i.test(userAgent) && !/edge|edg|opr/i.test(userAgent)) {
    return "chrome";
  }
  if (/firefox|fxios/i.test(userAgent)) {
    return "firefox";
  }
  if (/safari/i.test(userAgent) && !/chrome|crios|crmo|android/i.test(userAgent)) {
    return "safari";
  }
  if (/edg/i.test(userAgent)) {
    return "edge";
  }
  if (/opr\//i.test(userAgent)) {
    return "opera";
  }

  return "browser";
}

export function environment(): string {
  if (typeof navigator !== "undefined" && (navigator as any).product === "ReactNative") {
    return "react-native";
  }

  if (typeof globalThis !== "undefined" && (globalThis as any)?.HermesInternal) {
    return "react-native";
  }

  if (typeof process !== "undefined" && process.release?.name === "node") {
    return "node";
  }

  if (typeof (globalThis as any).window !== "undefined") {
    return detectBrowser();
  }

  return "unknown";
}

export function logAndThrow(message: string): never {
  console.error(message);
  throw new Error(message);
}

export function parseJSON<T = unknown>(json: string): T {
  function revive(_key: string, value: unknown, ctx: { source: string }): unknown {
    if (Number.isInteger(value)) {
      try {
        return BigInt(ctx.source);
      } catch (_error) {
        return value;
      }
    }
    return value;
  }

  return JSON.parse(json, revive as (key: string, value: unknown) => unknown);
}

export async function get(url: URL | string, options?: RequestInit): Promise<Response> {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`${response.status} could not get URL ${url}`);
  }

  return response;
}

export async function post(url: URL | string, options: RequestInit): Promise<Response> {
  const requestOptions: RequestInit = { ...options, method: "POST" };
  const response = await fetch(url, requestOptions);

  if (!response.ok) {
    throw new Error(`${response.status} could not post URL ${url}`);
  }

  return response;
}

type RetryOptions = {
  maxAttempts?: number;
  baseDelay?: number;
  jitter?: number;
  retryOnStatus?: number[];
  shouldRetry?: (err: unknown) => boolean;
};

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
      console.warn(`Retry ${attempt}/${maxAttempts} failed. Retrying in ${delay}ms...`, error);

      await new Promise((res) => setTimeout(res, delay));
    }
  }

  throw new Error("retryWithBackoff: unreachable");
}

export function validateProgramName(programName: string): void {
  if (!programName.endsWith(".aleo")) {
    throw new Error("Program name must end with .aleo");
  }
}
