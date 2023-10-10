import * as $fs from "node:fs";
import $mime from "mime/lite.js";


const oldFetch = globalThis.fetch;

// We always polyfill fetch because Node's fetch doesn't support file URLs.
(globalThis.fetch as any) = async function (resource: URL | RequestInfo, options: RequestInit | undefined): Promise<Response> {
    const request = new Request(resource, options);

    const url = new URL(request.url);

    if (url.protocol === "file:") {
        const readStream = $fs.createReadStream(url);

        const headers: HeadersInit = {};

        const type = $mime.getType(url.pathname);

        if (type) {
            headers["Content-Type"] = type;
        }

        return new Response(readStream as any, {
            status: 200,
            statusText: "OK",
            headers,
        });

    } else {
        return await oldFetch(request);
    }
};
