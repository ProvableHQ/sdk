import { post } from "./http.js";
import type {
  EncryptedRegistrationRequest,
  OwnedRecord,
  RecordOwnershipFilter,
  RecordScannerClientOptions,
  RegistrationResponse,
  Result,
} from "./models.js";
import { parseJSON } from "./utils.js";

export class RecordScannerClient {
  private readonly baseUrl: string;
  private apiKey?: { header: string; value: string };

  constructor(options: RecordScannerClientOptions) {
    if (options.url.endsWith("/mainnet") || options.url.endsWith("/testnet")) {
      throw new Error("Record scanner URL should not include a network suffix");
    }

    this.baseUrl = options.url.replace(/\/+$/, "");
    if (typeof options.apiKey === "string") {
      this.apiKey = { header: "X-Provable-API-Key", value: options.apiKey };
    } else {
      this.apiKey = options.apiKey;
    }
  }

  async registerEncrypted(request: EncryptedRegistrationRequest): Promise<Result<RegistrationResponse>> {
    try {
      const response = await post(`${this.baseUrl}/register/encrypted`, {
        headers: this.withHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(request),
      });
      const data = parseJSON<RegistrationResponse>(await response.text());
      return { ok: true, data };
    } catch (error) {
      return {
        ok: false,
        status: 500,
        error: { message: error instanceof Error ? error.message : String(error), status: 500 },
      };
    }
  }

  async owned(filter: RecordOwnershipFilter): Promise<Result<OwnedRecord[]>> {
    try {
      const response = await post(`${this.baseUrl}/records/owned`, {
        headers: this.withHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(filter),
      });
      const data = parseJSON<OwnedRecord[]>(await response.text());
      return { ok: true, data };
    } catch (error) {
      return {
        ok: false,
        status: 500,
        error: { message: error instanceof Error ? error.message : String(error), status: 500 },
      };
    }
  }

  private withHeaders(headers: Record<string, string>): Record<string, string> {
    if (!this.apiKey) {
      return headers;
    }

    return {
      ...headers,
      [this.apiKey.header]: this.apiKey.value,
    };
  }
}
