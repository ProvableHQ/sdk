import sinon from "sinon";
import { expect } from "chai";
import { cookieAffinityTransport } from "../src/utils/utils.js";

/**
 * Tests for the per-origin cookie jar inside `cookieAffinityTransport`.
 *
 * The transport captures `Set-Cookie` headers from responses and replays them
 * as `Cookie` on later requests to the same origin, so SDK consumers running
 * on Node or bare React Native can talk to backends that use cookie-based
 * session affinity.
 *
 * The cookie jar is module-scoped, so each test below uses a fresh, unique
 * origin to avoid pollution between tests.
 *
 * Imports `cookieAffinityTransport` directly from `src/utils/utils.js` so the test
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

describe("cookieAffinityTransport cookie jar", () => {
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
        await cookieAffinityTransport(`${origin}/first`);
        expect(
            getCookieHeader(
                fetchStub.firstCall.args[1] as RequestInit | undefined,
            ),
        ).to.equal(
            null,
            "first request must not have a Cookie header — jar is empty for this origin",
        );

        // Second request — jar should attach `route=upstream-7`.
        await cookieAffinityTransport(`${origin}/second`);
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

        await cookieAffinityTransport(`${originA}/path`);
        await cookieAffinityTransport(`${originB}/path`);

        const cookieOnB = getCookieHeader(
            fetchStub.secondCall.args[1] as RequestInit | undefined,
        );
        expect(cookieOnB).to.equal(
            null,
            "origin B must NOT inherit origin A's cookie",
        );
    });

    it("scopes the cookie to the response origin (response.url), not the request input origin, after a cross-origin redirect", async () => {
        const requestOrigin = "https://redirect-from.example.test";
        const responseOrigin = "https://redirect-to.example.test";

        // fetch follows a redirect: the request targets `requestOrigin` but
        // the final response (carrying the Set-Cookie) is served from
        // `responseOrigin`, surfaced via `response.url`.
        const redirected = {
            ok: true,
            status: 200,
            url: `${responseOrigin}/end`,
            headers: {
                get: (name: string) =>
                    name.toLowerCase() === "set-cookie"
                        ? "route=on-final-origin; Path=/; HttpOnly"
                        : null,
            },
            text: () => Promise.resolve("{}"),
        };
        fetchStub.onCall(0).resolves(redirected as unknown as Response);
        fetchStub.onCall(1).resolves(makeResponse());
        fetchStub.onCall(2).resolves(makeResponse());

        await cookieAffinityTransport(`${requestOrigin}/start`);

        // A later request to the response origin must replay the cookie.
        await cookieAffinityTransport(`${responseOrigin}/again`);
        expect(
            getCookieHeader(
                fetchStub.secondCall.args[1] as RequestInit | undefined,
            ),
        ).to.equal(
            "route=on-final-origin",
            "cookie must be keyed under the response origin so it replays there",
        );

        // A later request to the original request input origin must NOT carry
        // the cookie — it was never that origin's cookie.
        await cookieAffinityTransport(`${requestOrigin}/again`);
        expect(
            getCookieHeader(
                fetchStub.thirdCall.args[1] as RequestInit | undefined,
            ),
        ).to.equal(
            null,
            "cookie must be scoped to the response origin, not the request input origin",
        );
    });

    it("does not overwrite a caller-provided Cookie header", async () => {
        const origin = "https://caller-wins.example.test";

        // Seed the jar with a cookie at this origin.
        fetchStub.onCall(0).resolves(makeResponse("route=fromserver"));
        // Second call: caller passes their own Cookie header — should win.
        fetchStub.onCall(1).resolves(makeResponse());

        await cookieAffinityTransport(`${origin}/seed`);
        await cookieAffinityTransport(`${origin}/with-caller-cookie`, {
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

        await cookieAffinityTransport(`${origin}/first`);
        await cookieAffinityTransport(`${origin}/second`);

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

        await cookieAffinityTransport(`${origin}/first`);
        await cookieAffinityTransport(`${origin}/second`);

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

        await cookieAffinityTransport(`${origin}/seed`);
        await cookieAffinityTransport(`${origin}/check`);

        const cookie = getCookieHeader(
            fetchStub.secondCall.args[1] as RequestInit | undefined,
        );
        expect(cookie).to.equal(
            null,
            "unrelated cookies must NOT enter the jar",
        );
    });

    it("attaches the jar cookie when the input is a Request object (via init.headers, not by mutating the Request)", async () => {
        const origin = "https://request-input.example.test";
        // Seed the jar.
        fetchStub.onCall(0).resolves(makeResponse("route=upstream-3"));
        // Inspect what cookieAffinityTransport forwards to fetch.
        fetchStub.onCall(1).resolves(makeResponse());

        await cookieAffinityTransport(`${origin}/seed`);

        const req = new Request(`${origin}/next`);
        await cookieAffinityTransport(req);

        // The cookie must reach fetch on init.headers (Fetch spec:
        // init.headers replaces Request.headers). The original Request
        // object must NOT have been mutated.
        expect(req.headers.get("cookie")).to.equal(
            null,
            "caller's Request object must not be mutated",
        );
        const cookieOnInit = getCookieHeader(
            fetchStub.secondCall.args[1] as RequestInit | undefined,
        );
        expect(cookieOnInit).to.equal("route=upstream-3");
    });

    it("preserves a caller Cookie passed via a Headers instance", async () => {
        const origin = "https://headers-instance.example.test";
        fetchStub.onCall(0).resolves(makeResponse("route=fromserver"));
        fetchStub.onCall(1).resolves(makeResponse());

        await cookieAffinityTransport(`${origin}/seed`);

        const callerHeaders = new Headers({
            Cookie: "caller=wins-via-headers",
        });
        await cookieAffinityTransport(`${origin}/next`, {
            headers: callerHeaders,
        });

        const cookie = getCookieHeader(
            fetchStub.secondCall.args[1] as RequestInit | undefined,
        );
        expect(cookie).to.equal("caller=wins-via-headers");
    });

    it("preserves a caller Cookie passed via tuple-array headers", async () => {
        const origin = "https://tuple-array.example.test";
        fetchStub.onCall(0).resolves(makeResponse("route=fromserver"));
        fetchStub.onCall(1).resolves(makeResponse());

        await cookieAffinityTransport(`${origin}/seed`);
        await cookieAffinityTransport(`${origin}/next`, {
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

        await cookieAffinityTransport(`${origin}/seed`);

        const req = new Request(`${origin}/next`);
        await cookieAffinityTransport(req, {
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

        await cookieAffinityTransport(`${origin}/first`);
        await cookieAffinityTransport(`${origin}/second`);

        const cookie = getCookieHeader(
            fetchStub.secondCall.args[1] as RequestInit | undefined,
        );
        expect(cookie).to.equal("route=upstream-42");
    });

    it("does not mutate a caller-supplied Headers instance, and does not leak cookies across origins when reused", async () => {
        const originA = "https://reuse-leak-a.example.test";
        const originB = "https://reuse-leak-b.example.test";

        // Seed each origin with its own routing cookie.
        fetchStub.onCall(0).resolves(makeResponse("route=upstream-A"));
        fetchStub.onCall(1).resolves(makeResponse("route=upstream-B"));
        // Inspection targets — the two subsequent calls share the same
        // Headers/init object across origins.
        fetchStub.onCall(2).resolves(makeResponse());
        fetchStub.onCall(3).resolves(makeResponse());

        await cookieAffinityTransport(`${originA}/seed`);
        await cookieAffinityTransport(`${originB}/seed`);

        const sharedHeaders = new Headers({ "X-Trace-Id": "trace-1" });
        const sharedInit: RequestInit = { headers: sharedHeaders };

        await cookieAffinityTransport(`${originA}/req-A`, sharedInit);

        // After the A call, the caller's shared Headers must NOT carry
        // a Cookie, and the init object must still hold the original
        // sharedHeaders reference (no replacement of the field on the
        // caller's object).
        expect(sharedHeaders.get("cookie")).to.equal(
            null,
            "caller's Headers must not be mutated",
        );
        expect(sharedInit.headers).to.equal(
            sharedHeaders,
            "caller's init.headers reference must not be replaced",
        );

        await cookieAffinityTransport(`${originB}/req-B`, sharedInit);

        // Caller's Headers still untouched after the B call.
        expect(sharedHeaders.get("cookie")).to.equal(null);
        // And — critically — request B must carry origin B's cookie,
        // not origin A's leftover from the first call.
        const cookieOnB = getCookieHeader(
            fetchStub.lastCall.args[1] as RequestInit | undefined,
        );
        expect(cookieOnB).to.equal(
            "route=upstream-B",
            "origin B must NOT inherit origin A's cookie via shared init",
        );
    });

    it("does not add new properties to a caller-supplied init object", async () => {
        const origin = "https://no-init-key-pollution.example.test";
        fetchStub.onCall(0).resolves(makeResponse("route=upstream-z"));
        fetchStub.onCall(1).resolves(makeResponse());

        await cookieAffinityTransport(`${origin}/seed`);

        // Caller passes init without a headers field.
        const callerInit: RequestInit = { method: "GET" };
        const originalKeys = Object.keys(callerInit).sort();

        await cookieAffinityTransport(`${origin}/next`, callerInit);

        // Transport must not have mutated callerInit by adding a
        // `headers` field (or anything else).
        expect(Object.keys(callerInit).sort()).to.deep.equal(originalKeys);
        expect("headers" in callerInit).to.equal(
            false,
            "caller's init must not gain a headers field",
        );
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

        await cookieAffinityTransport(`${origin}/first`);
        await cookieAffinityTransport(`${origin}/second`);

        const cookie = getCookieHeader(
            fetchStub.secondCall.args[1] as RequestInit | undefined,
        );
        expect(cookie).to.equal("route=upstream-99");
    });
});
