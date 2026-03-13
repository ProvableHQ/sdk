/**
 * RegistrationResponse is a type that represents a response from a record scanning service's registration endpoint.
 *
 * @example
 * const registrationResponse: RegistrationResponse = {
 *     uuid: "5291249998620209321712738612705518874926462927543783711572375085855029172391field",
 *     status: "pending",
 * }
 */
export interface RegistrationResponse {
    uuid: string;
    status?: string;
}
