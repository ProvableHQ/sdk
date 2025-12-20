// @ts-ignore
import $xmlhttprequest from "xmlhttprequest-ssl";

if (globalThis.XMLHttpRequest == null) {
    function XMLHttpRequest(opts?: any) {
        return new $xmlhttprequest.XMLHttpRequest({syncPolicy: "enabled", ...opts});
    }
    (globalThis as any).XMLHttpRequest = XMLHttpRequest;
}