/**
 * RegistrationRequest is a type that represents a request to register an account's view key with a record scanning service.
 * 
 * @example
 * const registrationRequest: RegistrationRequest = {
 *     viewKey: "...",
 *     start: 123456,
 * }
 */
export type RegistrationRequest = {
    viewKey: string;
    start: number;
}