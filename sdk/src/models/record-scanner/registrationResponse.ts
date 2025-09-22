/**
 * RegistrationResponse is a type that represents a response from a record scanning service.
 * 
 * @example
 * const registrationResponse: RegistrationResponse = {
 *     uuid: "5291249998620209321712738612705518874926462927543783711572375085855029172391field",
 *     job_id: "3019177021147406178755252788128212930359855601860174268911518336835545087409field",
 *     status: "pending",
 * }
 */
export interface RegistrationResponse {
    uuid: string,
    job_id?: string,
    status?: string 
 }