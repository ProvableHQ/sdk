/**
 * Log levels in ascending severity. Each level includes all levels above it.
 * "silent" suppresses all output. "debug" enables everything.
 *
 * @example
 * import { setLogLevel } from "@provablehq/sdk";
 * setLogLevel("silent"); // suppress all SDK logging
 */
export type LogLevel = "silent" | "error" | "warn" | "info" | "debug";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
    silent: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
};

let currentLevel: LogLevel = "info";

/**
 * Set the SDK log level. Levels are hierarchical:
 * - "silent" — suppress all SDK logging
 * - "error"  — only errors
 * - "warn"   — errors + warnings
 * - "info"   — errors + warnings + info (default)
 * - "debug"  — everything including debug traces
 *
 * This controls both TS-side and WASM-side logging. WASM log calls
 * (e.g., "Loading program", "Executing program") are silenced when
 * the level is below "info".
 */
export function setLogLevel(level: LogLevel): void {
    currentLevel = level;
    import("../wasm.js")
        .then(({ setWasmLogLevel }) => setWasmLogLevel(LEVEL_PRIORITY[level]))
        .catch(() => {}); // WASM not loaded yet — will use default level (info)
}

/** Returns the current SDK log level. */
export function getLogLevel(): LogLevel {
    return currentLevel;
}

function shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] <= LEVEL_PRIORITY[currentLevel];
}

/**
 * SDK logger object following console.log/warn/error/debug syntax.
 * Respects the current log level set via setLogLevel().
 */
export const logger = {
    log(...args: unknown[]): void {
        if (shouldLog("info")) console.log(...args);
    },
    warn(...args: unknown[]): void {
        if (shouldLog("warn")) console.warn(...args);
    },
    error(...args: unknown[]): void {
        if (shouldLog("error")) console.error(...args);
    },
    debug(...args: unknown[]): void {
        if (shouldLog("debug")) console.debug(...args);
    },
};
