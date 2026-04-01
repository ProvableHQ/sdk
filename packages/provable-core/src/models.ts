export interface CryptoBoxPubKey {
  key_id: string;
  public_key: string;
}

export interface RecordScannerJWTData {
  jwt: string;
  expiration: number;
}

export interface RecordScannerError {
  message: string;
  status: number;
}

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: RecordScannerError };

export interface RegistrationResponse {
  uuid: string;
  status?: string;
}

export interface EncryptedRegistrationRequest {
  key_id: string;
  ciphertext: string;
}

export interface RecordOwnershipFilter {
  uuid?: string;
  unspent?: boolean;
  filter?: Record<string, unknown>;
  responseFilter?: Record<string, boolean>;
  nonces?: string[];
}

export interface OwnedRecord {
  owner?: string;
  program_name?: string;
  record_name?: string;
  record_plaintext: string;
  [key: string]: unknown;
}

export interface RecordScannerClientOptions {
  url: string;
  apiKey?: string | { header: string; value: string };
  consumerId?: string;
  jwtData?: RecordScannerJWTData;
}
