import "./polyfill/shared.js";
import "./polyfill/crypto.js";
import "./polyfill/fetch.js";
import "./polyfill/xmlhttprequest.js";
import "./polyfill/worker.js";

if (!globalThis.self) {
    (globalThis as any).self = globalThis;
}
