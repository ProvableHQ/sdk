/**
 * Reason code for invalid locator validation failures.
 * - `"reserved_name"`: Locator is empty or the reserved name `"."` or `".."`.
 * - `"path_traversal"`: Locator contains `..`.
 * - `"path_separator"`: Locator contains a path separator (`/`, `\`) or null byte.
 */
export type InvalidLocatorReason =
    | "reserved_name"
    | "path_traversal"
    | "path_separator";

/**
 * Error thrown when a key locator is invalid for filesystem use.
 * Used to prevent path traversal and other filesystem injection when deriving paths from locators.
 *
 * @extends Error
 */
export class InvalidLocatorError extends Error {
    /**
     * @param message - Human-readable description of the validation failure.
     * @param locator - The invalid locator string that failed validation.
     * @param reason - Machine-readable reason code for the failure.
     */
    constructor(
        message: string,
        public readonly locator: string,
        public readonly reason: InvalidLocatorReason
    ) {
        super(message);
        this.name = "InvalidLocatorError";
        Object.setPrototypeOf(this, InvalidLocatorError.prototype);
    }
}
