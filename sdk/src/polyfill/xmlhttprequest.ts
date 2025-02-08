// @ts-ignore
import $xmlhttprequest from "xmlhttprequest-ssl";
import $request from "sync-request";

if (globalThis.XMLHttpRequest == null) {
    globalThis.XMLHttpRequest = class extends $xmlhttprequest.XMLHttpRequest {
        // We have to override the methods inside of the `constructor`
        // because `xmlhttprequest-ssl` doesn't use a regular class,
        // instead it defines all of the methods inside of the constructor.
        constructor(...args: Array<any>) {
            super(...args);

            const open = (this as any).open;
            const send = (this as any).send;

            let _async: boolean = true;
            let _url: null | string = null;
            let _mime: string = "text/xml";

            function reset() {
                _async = true;
                _url = null;
                _mime = "text/xml";
            }

            (this as any).open = function (method: string, url: string, async: boolean, user?: string, password?: string) {
                // Special behavior for synchronous requests
                if (method === "GET" && !async && !user && !password) {
                    _async = false;
                    _url = url;

                // Default to the normal polyfill for async requests
                } else {
                    reset();
                    return open.call(this, method, url, async, user, password);
                }
            };

            (this as any).send = function (data: any) {
                if (_async) {
                    return send.call(this, data);

                // Use `sync-request` for synchronous requests.
                } else {
                    const response = $request("GET", _url!, {
                        headers: {
                            "Content-Type": _mime,
                        }
                    });

                    const buffer = (response.body as Buffer).buffer as any;

                    const responseText = new TextDecoder("iso-8859-5", { fatal: true }).decode(buffer);

                    (this as any).status = 200;
                    (this as any).response = (this as any).responseText = responseText;

                    reset();
                }
            };

            (this as any).overrideMimeType = function (mime: string) {
                _mime = mime;
            };
        }
    } as any;
}
