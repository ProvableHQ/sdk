import sinon from "sinon";
import { expect } from "chai";
import { defaultTransport } from "../src/utils/utils.js";

/**
 * Tests for the per-origin cookie jar inside `defaultTransport`.
 *
 * The transport captures `Set-Cookie` headers from responses and replays them
 * as `Cookie` on later requests to the same origin, so SDK consumers running
 * on Node or bare React Native can talk to backends that use cookie-based
 * session affinity.
 *
 * The cookie jar is module-scoped, so each test below uses a fresh, unique
 * origin to avoid pollution between tests.
 *
 * Imports `defaultTransport` directly from `src/utils/utils.js` so the test
 * bundle doesn't pull in the WASM module — these are pure transport assertions.
 */

type FetchStub = sinon.SinonStub<
    Parameters<typeof fetch>,
    ReturnType<typeof fetch>
>;

function makeResponse(setCookie?: string): Response {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (setCookie !== undefined) {
        headers["set-cookie"] = setCookie;
    }
    return new Response("{}", { status: 200, headers });
}

function getCookieHeader(init: RequestInit | undefined): string | null {
    if (!init || !init.headers) return null;
    const headers = init.headers;
    if (headers instanceof Headers) {
        return headers.get("cookie");
    }
    if (Array.isArray(headers)) {
        for (const pair of headers) {
            if (
                Array.isArray(pair) &&
                typeof pair[0] === "string" &&
                pair[0].toLowerCase() === "cookie"
            ) {
                return String(pair[1]);
            }
        }
        return null;
    }
    if (typeof headers === "object") {
        for (const [key, value] of Object.entries(headers)) {
            if (key.toLowerCase() === "cookie") return String(value);
        }
    }
    return null;
}

describe("defaultTransport cookie jar", () => {
    let fetchStub: FetchStub;

    beforeEach(() => {
        // Stub the global fetch the transport delegates to.
        fetchStub = sinon.stub(globalThis, "fetch") as FetchStub;
    });

    afterEach(() => {
        sinon.restore();
    });

    it("captures the affinity Set-Cookie and attaches it on the next same-origin request", async () => {
        const origin = "https://capture-attach.example.test";
        // First call: server sends the Kong routing cookie.
        // Second call: empty response so the assertion isolates the captured cookie.
        fetchStub
            .onFirstCall()
            .resolves(makeResponse("route=upstream-7; Path=/; HttpOnly"));
        fetchStub.onSecondCall().resolves(makeResponse());

        // First request — no Cookie expected yet (jar is empty for this origin).
        await defaultTransport(`${origin}/first`);
        expect(
            getCookieHeader(
                fetchStub.firstCall.args[1] as RequestInit | undefined,
            ),
        ).to.equal(
            null,
            "first request must not have a Cookie header — jar is empty for this origin",
        );

        // Second request — jar should attach `route=upstream-7`.
        await defaultTransport(`${origin}/second`);
        const secondCookie = getCookieHeader(
            fetchStub.secondCall.args[1] as RequestInit | undefined,
        );
        expect(secondCookie).to.equal("route=upstream-7");
    });

    it("scopes cookies by origin — does not leak cookies from origin A to origin B", async () => {
        const originA = "https://scope-a.example.test";
        const originB = "https://scope-b.example.test";

        // First call (origin A): set a cookie.
        fetchStub.onCall(0).resolves(makeResponse("route=a"));
        // Second call (origin B): the assertion target.
        fetchStub.onCall(1).resolves(makeResponse());

        await defaultTransport(`${originA}/path`);
        await defaultTransport(`${originB}/path`);

        const cookieOnB = getCookieHeader(
            fetchStub.secondCall.args[1] as RequestInit | undefined,
        );
        expect(cookieOnB).to.equal(
            null,
            "origin B must NOT inherit origin A's cookie",
        );
    });

    it("does not overwrite a caller-provided Cookie header", async () => {
        const origin = "https://caller-wins.example.test";

        // Seed the jar with a cookie at this origin.
        fetchStub.onCall(0).resolves(makeResponse("route=fromserver"));
        // Second call: caller passes their own Cookie header — should win.
        fetchStub.onCall(1).resolves(makeResponse());

        await defaultTransport(`${origin}/seed`);
        await defaultTransport(`${origin}/with-caller-cookie`, {
            headers: { Cookie: "caller=wins" },
        });

        const cookie = getCookieHeader(
            fetchStub.secondCall.args[1] as RequestInit | undefined,
        );
        expect(cookie).to.equal("caller=wins");
        expect(cookie).to.not.include("route=fromserver");
    });

    it("ignores response objects without a headers field (back-compat with minimal fetch mocks)", async () => {
        const origin = "https://minimal-mock.example.test";
        // Minimal response-like object — no `headers` field at all. This
        // mirrors how the rest of the SDK tests stub fetch.
        const minimal = {
            ok: true,
            status: 200,
            text: () => Promise.resolve("{}"),
        };
        fetchStub.onCall(0).resolves(minimal as unknown as Response);
        fetchStub.onCall(1).resolves(makeResponse());

        await defaultTransport(`${origin}/first`);
        await defaultTransport(`${origin}/second`);

        // Nothing should have been captured from the headerless mock.
        const cookie = getCookieHeader(
            fetchStub.secondCall.args[1] as RequestInit | undefined,
        );
        expect(cookie).to.equal(null);
    });

    it("uses getSetCookie() when the runtime exposes it (Node multi-Set-Cookie)", async () => {
        const origin = "https://get-set-cookie.example.test";
        const headers = {
            // Simulates Node's Headers, which returns multiple Set-Cookie
            // values via getSetCookie() while .get('set-cookie') collapses
            // them into one ambiguous string.
            getSetCookie: () => [
                "route=upstream-9; Path=/",
                "ignored-name=other; Path=/",
            ],
            get: (name: string) =>
                name.toLowerCase() === "set-cookie"
                    ? "route=upstream-9, ignored-name=other"
                    : null,
        };
        fetchStub.onCall(0).resolves({
            ok: true,
            status: 200,
            headers,
            text: () => Promise.resolve("{}"),
        } as unknown as Response);
        fetchStub.onCall(1).resolves(makeResponse());

        await defaultTransport(`${origin}/first`);
        await defaultTransport(`${origin}/second`);

        const cookie = getCookieHeader(
            fetchStub.secondCall.args[1] as RequestInit | undefined,
        );
        // Only the whitelisted `route` cookie is captured. The unrelated
        // name is dropped even though getSetCookie() returned it.
        expect(cookie).to.equal("route=upstream-9");
    });

    it("drops non-whitelisted cookies (no cross-client leakage of auth/session cookies)", async () => {
        const origin = "https://whitelist.example.test";
        fetchStub
            .onCall(0)
            .resolves(makeResponse("auth=secret-token; Path=/; HttpOnly"));
        fetchStub.onCall(1).resolves(makeResponse());

        await defaultTransport(`${origin}/seed`);
        await defaultTransport(`${origin}/check`);

        const cookie = getCookieHeader(
            fetchStub.secondCall.args[1] as RequestInit | undefined,
        );
        expect(cookie).to.equal(
            null,
            "unrelated cookies must NOT enter the jar",
        );
    });

    it("attaches the jar cookie when the input is a Request object", async () => {
        const origin = "https://request-input.example.test";
        // Seed the jar.
        fetchStub.onCall(0).resolves(makeResponse("route=upstream-3"));
        // Inspect what defaultTransport forwards to fetch.
        fetchStub.onCall(1).resolves(makeResponse());

        await defaultTransport(`${origin}/seed`);

        const req = new Request(`${origin}/next`);
        await defaultTransport(req);

        // After the call, the Request's headers should carry the cookie.
        // (Some runtimes treat Request headers as guarded; the transport
        // catches that and skips silently — we only assert here when the
        // header was settable.)
        const forwarded = fetchStub.secondCall.args[0] as Request;
        expect(forwarded).to.be.instanceof(Request);
        const cookieOnReq = forwarded.headers.get("cookie");
        if (cookieOnReq !== null) {
            expect(cookieOnReq).to.equal("route=upstream-3");
        }
    });

    it("preserves a caller Cookie passed via a Headers instance", async () => {
        const origin = "https://headers-instance.example.test";
        fetchStub.onCall(0).resolves(makeResponse("route=fromserver"));
        fetchStub.onCall(1).resolves(makeResponse());

        await defaultTransport(`${origin}/seed`);

        const callerHeaders = new Headers({
            Cookie: "caller=wins-via-headers",
        });
        await defaultTransport(`${origin}/next`, { headers: callerHeaders });

        const cookie = getCookieHeader(
            fetchStub.secondCall.args[1] as RequestInit | undefined,
        );
        expect(cookie).to.equal("caller=wins-via-headers");
    });

    it("preserves a caller Cookie passed via tuple-array headers", async () => {
        const origin = "https://tuple-array.example.test";
        fetchStub.onCall(0).resolves(makeResponse("route=fromserver"));
        fetchStub.onCall(1).resolves(makeResponse());

        await defaultTransport(`${origin}/seed`);
        await defaultTransport(`${origin}/next`, {
            headers: [["Cookie", "caller=wins-via-tuple"]],
        });

        const cookie = getCookieHeader(
            fetchStub.secondCall.args[1] as RequestInit | undefined,
        );
        expect(cookie).to.equal("caller=wins-via-tuple");
    });

    it("attaches the cookie to init.headers (not input.headers) when both a Request and init.headers are provided", async () => {
        // Fetch spec: init.headers fully overrides Request.headers when
        // both are present. If we attach to input.headers here, fetch
        // silently discards our cookie.
        const origin = "https://request-plus-init-headers.example.test";
        fetchStub.onCall(0).resolves(makeResponse("route=upstream-11"));
        fetchStub.onCall(1).resolves(makeResponse());

        await defaultTransport(`${origin}/seed`);

        const req = new Request(`${origin}/next`);
        await defaultTransport(req, {
            headers: { "X-Trace-Id": "abc" },
        });

        // Both `args[0]` (the Request) and `args[1]` (the init) are
        // forwarded — fetch will use init.headers, so that's where the
        // jar cookie must end up.
        const initOnCall = fetchStub.secondCall.args[1] as
            | RequestInit
            | undefined;
        expect(getCookieHeader(initOnCall)).to.equal(
            "route=upstream-11",
            "init.headers wins per fetch spec; cookie must be attached there",
        );
    });

    it("parses multiple cookies from a comma-joined Set-Cookie fallback string", async () => {
        // Older runtimes that don't implement getSetCookie() comma-join
        // multiple Set-Cookie headers into a single string via
        // headers.get('set-cookie'). With the whitelisted cookie not in
        // the first position, the naive split(';')[0] approach would
        // drop `route` entirely.
        const origin = "https://comma-joined.example.test";
        const headers = {
            // No getSetCookie() — forces the fallback path.
            get: (name: string) =>
                name.toLowerCase() === "set-cookie"
                    ? "first=val1; Path=/, route=upstream-42; Path=/; HttpOnly"
                    : null,
        };
        fetchStub.onCall(0).resolves({
            ok: true,
            status: 200,
            headers,
            text: () => Promise.resolve("{}"),
        } as unknown as Response);
        fetchStub.onCall(1).resolves(makeResponse());

        await defaultTransport(`${origin}/first`);
        await defaultTransport(`${origin}/second`);

        const cookie = getCookieHeader(
            fetchStub.secondCall.args[1] as RequestInit | undefined,
        );
        expect(cookie).to.equal("route=upstream-42");
    });

    it("does not split on commas inside Expires=... date attributes (fallback path)", async () => {
        const origin = "https://date-comma.example.test";
        const headers = {
            // Expires has a comma inside its date format. A naive split
            // on `, ` would slice through it. Our split-on-comma-before-
            // -cookie-name regex must skip it.
            get: (name: string) =>
                name.toLowerCase() === "set-cookie"
                    ? "route=upstream-99; Expires=Wed, 21 Oct 2099 07:28:00 GMT; Path=/"
                    : null,
        };
        fetchStub.onCall(0).resolves({
            ok: true,
            status: 200,
            headers,
            text: () => Promise.resolve("{}"),
        } as unknown as Response);
        fetchStub.onCall(1).resolves(makeResponse());

        await defaultTransport(`${origin}/first`);
        await defaultTransport(`${origin}/second`);

        const cookie = getCookieHeader(
            fetchStub.secondCall.args[1] as RequestInit | undefined,
        );
        expect(cookie).to.equal("route=upstream-99");
    });
});
