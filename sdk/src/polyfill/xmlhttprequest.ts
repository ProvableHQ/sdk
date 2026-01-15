// @ts-ignore
import $xmlhttprequest from "xmlhttprequest-ssl";

if (globalThis.XMLHttpRequest == null) {
    (globalThis as any).XMLHttpRequest = class extends $xmlhttprequest.XMLHttpRequest {
        constructor(opts?: any) {
            super({ syncPolicy: "enabled", ...opts });
        }
    };
}