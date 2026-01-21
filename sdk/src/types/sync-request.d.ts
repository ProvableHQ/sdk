declare module "sync-request" {
    export type SyncRequestOptions = {
        headers?: Record<string, string>;
        qs?: Record<string, string | number | boolean>;
        json?: unknown;
        body?: unknown;
        timeout?: number;
    };

    export type SyncRequestResponse = {
        statusCode?: number;
        headers?: Record<string, string | string[] | undefined>;
        body: unknown;
        getBody?: (encoding?: string) => unknown;
    };

    export default function request(method: string, url: string, options?: SyncRequestOptions): SyncRequestResponse;
}

