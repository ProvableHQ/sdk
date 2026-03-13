/**
 * RegistrationRequest is a type that represents a request to register an account's view key with a record scanning service.
 *
 * @example
 * const registrationRequest: RegistrationRequest = {
 *     view_key: "AViewKey1ccEt8A2Ryva5rxnKcAbn7wgTaTsb79tzkKHFpeKsm9NX",
 *     start: 123456,
 * }
 */
export type RegistrationRequest = {
    view_key: string;
    start: number;
};
