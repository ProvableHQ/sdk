import "./polyfill/crypto";
import "./polyfill/fetch";
import "./polyfill/xmlhttprequest";
import "./polyfill/worker";

if (!globalThis.self) {
    (globalThis as any).self = globalThis;
}
