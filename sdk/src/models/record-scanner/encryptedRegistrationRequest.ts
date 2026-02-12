/**
 * Payload for the /register/encrypted record scanner endpoint.
 * Contains the ephemeral key id and the sealed ciphertext of the registration request.
 */
export interface EncryptedRegistrationRequest {
    key_id: string;
    ciphertext: string;
}
