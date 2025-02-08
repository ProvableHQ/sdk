// @ts-ignore
import $xmlhttprequest from "xmlhttprequest-ssl";

if (globalThis.XMLHttpRequest == null) {
    globalThis.XMLHttpRequest = $xmlhttprequest.XMLHttpRequest;
}
