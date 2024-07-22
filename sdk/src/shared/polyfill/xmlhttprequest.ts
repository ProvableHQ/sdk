import $request from "sync-request";


globalThis.XMLHttpRequest = class extends EventTarget implements XMLHttpRequest {
    public static readonly UNSENT = 0;
    public static readonly OPENED = 1;
    public static readonly HEADERS_RECEIVED = 2;
    public static readonly LOADING = 3;
    public static readonly DONE = 4;

    public readonly UNSENT = XMLHttpRequest.UNSENT;
    public readonly OPENED = XMLHttpRequest.OPENED;
    public readonly HEADERS_RECEIVED = XMLHttpRequest.HEADERS_RECEIVED;
    public readonly LOADING = XMLHttpRequest.LOADING;
    public readonly DONE = XMLHttpRequest.DONE;

    public responseType!: XMLHttpRequestResponseType;
    public withCredentials!: boolean;
    public timeout!: number;

    public readonly readyState!: number;
    public readonly response!: ArrayBuffer | Blob | Document | string | null;
    public readonly responseText!: string;
    public readonly responseURL!: string;
    public readonly responseXML!: Document | null;
    public readonly status!: number;
    public readonly statusText!: string;
    public readonly upload!: XMLHttpRequestUpload;

    private _url!: string | URL | null;
    private _mime!: string;

    constructor() {
        super();

        this._reset();

        this._mime = "text/xml";
    }

    private _reset() {
        (this as any).readyState = XMLHttpRequest.UNSENT;
        (this as any).response = null;
        (this as any).responseText = "";
        (this as any).responseType = "";
        (this as any).responseURL = "";
        (this as any).responseXML = null;
        (this as any).status = 0;
        (this as any).statusText = "";
        (this as any).timeout = 0;
        (this as any).upload = null;
        (this as any).withCredentials = false;

        this._url = null;
    }

    private _success() {
        (this as any).readyState = XMLHttpRequest.DONE;
        (this as any).status = 200;
        (this as any).statusText = "OK";
    }

    public set onabort(value: () => void) {
        throw new Error("Not implemented");
    }

    public set onerror(value: () => void) {
        throw new Error("Not implemented");
    }

    public set onreadystatechange(value: () => void) {
        throw new Error("Not implemented");
    }

    public set onloadstart(value: () => void) {
        throw new Error("Not implemented");
    }

    public set onload(value: () => void) {
        throw new Error("Not implemented");
    }

    public set onloadend(value: () => void) {
        throw new Error("Not implemented");
    }

    public set onprogress(value: () => void) {
        throw new Error("Not implemented");
    }

    public set ontimeout(value: () => void) {
        throw new Error("Not implemented");
    }

    public abort() {
        throw new Error("Not implemented");
    }

    public overrideMimeType(mime: string) {
        this._mime = mime;
    }

    public getResponseHeader(): string | null {
        throw new Error("Not implemented");
    }

    public getAllResponseHeaders(): string {
        throw new Error("Not implemented");
    }

    public setRequestHeader() {
        throw new Error("Not implemented");
    }

    public open(method: string, url: string | URL, async: boolean = true, username?: string | null | undefined, password?: string | null | undefined): void {
        if (async) {
            throw new Error("Async XMLHttpRequest is not implemented yet");
        }

        if (method !== "GET") {
            throw new Error("Non-GET requests are not implemented yet");
        }

        this._reset();

        this._url = url;
    }

    public send(body: null = null) {
        if (body !== null) {
            throw new Error("XMLHttpRequest send body is not implemented yet");
        }

        if (!this._url) {
            throw new Error("You must call open before you call send");
        }

        const response = $request("GET", this._url, {
            headers: {
                "Content-Type": this._mime,
            }
        });

        const buffer = (response.body as Buffer).buffer;

        const responseText = new TextDecoder("iso-8859-5", { fatal: true }).decode(buffer);

        (this as any).response = (this as any).responseText = responseText;

        this._url = null;

        this._success();
    }
};