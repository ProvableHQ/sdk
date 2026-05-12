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
 */
export function setLogLevel(level: LogLevel): void {
    currentLevel = level;
}

/** Returns the current SDK log level. */
export function getLogLevel(): LogLevel {
    return currentLevel;
}

function shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] <= LEVEL_PRIORITY[currentLevel];
}

export function sdkLog(...args: unknown[]): void {
    if (shouldLog("info")) console.log(...args);
}

export function sdkWarn(...args: unknown[]): void {
    if (shouldLog("warn")) console.warn(...args);
}

export function sdkError(...args: unknown[]): void {
    if (shouldLog("error")) console.error(...args);
}

export function sdkDebug(...args: unknown[]): void {
    if (shouldLog("debug")) console.debug(...args);
}
