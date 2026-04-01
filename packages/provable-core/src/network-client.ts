import { get, post } from "./http.js";
import { parseJSON } from "./utils.js";

export interface NetworkClientOptions {
  headers?: Record<string, string>;
}

export class CoreNetworkClient {
  private host: string;
  private headers: Record<string, string>;

  constructor(host: string, options?: NetworkClientOptions) {
    this.host = host.replace(/\/+$/, "");
    this.headers = options?.headers ?? {};
  }

  setHeader(name: string, value: string): void {
    this.headers[name] = value;
  }

  setHost(host: string): void {
    this.host = host.replace(/\/+$/, "");
  }

  async fetchJson<T>(path: string): Promise<T> {
    const response = await get(`${this.host}${path}`, { headers: this.headers });
    return parseJSON<T>(await response.text());
  }

  async postJson<T>(path: string, body: unknown): Promise<T> {
    const response = await post(`${this.host}${path}`, {
      headers: { "Content-Type": "application/json", ...this.headers },
      body: JSON.stringify(body),
    });
    return parseJSON<T>(await response.text());
  }
}
