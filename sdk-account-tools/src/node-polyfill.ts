// Copyright (C) 2019-2025 Provable Inc.
// This file is part of the Provable SDK library.

// The Provable SDK library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Provable SDK library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Provable SDK library. If not, see <https://www.gnu.org/licenses/>.

import * as $fs from "node:fs";

// Node.js fetch does not support file:// URLs. Patch it so that the WASM
// binary can be loaded from the local filesystem during testing.
const originalFetch = globalThis.fetch;

(globalThis.fetch as any) = async function (resource: any, options?: any): Promise<Response> {
    const request = new Request(resource, options);
    const url = new URL(request.url);

    if (url.protocol === "file:") {
        const buffer = $fs.readFileSync(url);
        return new Response(buffer as any, {
            status: 200,
            statusText: "OK",
            headers: { "Content-Type": "application/wasm" },
        });
    }

    return originalFetch(request);
};
