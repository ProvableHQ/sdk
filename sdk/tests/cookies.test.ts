import { expect } from "chai";
import { cookieFromSetCookies } from "../src/utils/utils.js";

/**
 * Returns a Headers object with the given Set-Cookie values appended individually,
 * so `headers.getSetCookie()` (Node 22+) sees each as a distinct entry.
 */
function headersWithSetCookies(values: string[]): Headers {
    const headers = new Headers();
    for (const v of values) headers.append("set-cookie", v);
    return headers;
}

describe("cookieFromSetCookies", () => {
    describe("happy paths", () => {
        it("returns null when there are no Set-Cookie headers", () => {
            const headers = new Headers();
            expect(cookieFromSetCookies(headers)).to.be.null;
        });

        it("returns a single name=value for one bare Set-Cookie", () => {
            const headers = headersWithSetCookies(["route=abc123"]);
            expect(cookieFromSetCookies(headers)).to.equal("route=abc123");
        });

        it("joins multiple Set-Cookies with `; ` (the bug fix)", () => {
            const headers = headersWithSetCookies([
                "route=kong-upstream-7f3a",
                "pubkey=app-issued-xyz789",
            ]);
            expect(cookieFromSetCookies(headers)).to.equal(
                "route=kong-upstream-7f3a; pubkey=app-issued-xyz789",
            );
        });
    });

    describe("attribute stripping", () => {
        it("drops Path / Max-Age / Secure / HttpOnly / SameSite from a single cookie", () => {
            const headers = headersWithSetCookies([
                "route=abc123; Path=/; Max-Age=3600; Secure; HttpOnly; SameSite=Lax",
            ]);
            expect(cookieFromSetCookies(headers)).to.equal("route=abc123");
        });

        it("drops attributes from every cookie when there are multiple", () => {
            const headers = headersWithSetCookies([
                "route=abc; Path=/; Max-Age=3600",
                "pubkey=xyz; Domain=.example.com; Expires=Wed, 21 Oct 2026 07:28:00 GMT",
            ]);
            expect(cookieFromSetCookies(headers)).to.equal(
                "route=abc; pubkey=xyz",
            );
        });
    });

    describe("edge cases", () => {
        it("preserves `=` characters that appear inside the cookie value", () => {
            const headers = headersWithSetCookies(["session=a=b=c=d; Path=/"]);
            expect(cookieFromSetCookies(headers)).to.equal("session=a=b=c=d");
        });

        it("trims leading/trailing whitespace around each name=value", () => {
            const headers = headersWithSetCookies(["  route=abc  ; Path=/"]);
            expect(cookieFromSetCookies(headers)).to.equal("route=abc");
        });

        it("falls back to .get('set-cookie') when getSetCookie is unavailable (single-cookie case)", () => {
            // Mimic an older Headers-like runtime that exposes .get() but not getSetCookie().
            const headersLike = {
                get: (name: string) =>
                    name === "set-cookie" ? "route=abc; Path=/" : null,
            } as unknown as Headers;
            expect(cookieFromSetCookies(headersLike)).to.equal("route=abc");
        });

        it("returns null from the fallback when .get('set-cookie') is null", () => {
            const headersLike = {
                get: () => null,
            } as unknown as Headers;
            expect(cookieFromSetCookies(headersLike)).to.be.null;
        });

        it("splits comma-joined Set-Cookie strings on the fallback path (legacy runtimes)", () => {
            // Older fetch runtimes lacking getSetCookie() join multiple
            // Set-Cookie response headers into one comma-separated string when
            // returned from .get("set-cookie"). The fallback path must split
            // those back into individual cookies before stripping attributes,
            // otherwise it drops every cookie except the first — reintroducing
            // exactly the bug this PR fixes, just relocated to legacy runtimes.
            const headersLike = {
                get: (name: string) =>
                    name === "set-cookie"
                        ? "route=abc; Path=/, pubkey=xyz; Max-Age=600"
                        : null,
            } as unknown as Headers;
            expect(cookieFromSetCookies(headersLike)).to.equal(
                "route=abc; pubkey=xyz",
            );
        });

        it("fallback split doesn't break commas inside Expires date attributes", () => {
            // `Expires=Wed, 21 Oct 2026 07:28:00 GMT` contains an internal
            // comma. The fallback split must only break on `, ` followed by a
            // cookie-name token, not on commas inside RFC 7231 date values.
            const headersLike = {
                get: (name: string) =>
                    name === "set-cookie"
                        ? "route=abc; Expires=Wed, 21 Oct 2026 07:28:00 GMT, pubkey=xyz; Max-Age=600"
                        : null,
            } as unknown as Headers;
            expect(cookieFromSetCookies(headersLike)).to.equal(
                "route=abc; pubkey=xyz",
            );
        });
    });

    describe("regression guards", () => {
        it("output never contains a comma — proves we don't reintroduce the pre-fix delimiter", () => {
            const headers = headersWithSetCookies([
                "route=abc",
                "pubkey=xyz",
                "third=ghi",
            ]);
            const result = cookieFromSetCookies(headers);
            expect(result).to.not.be.null;
            expect(result!).to.not.include(",");
        });

        it("RFC 6265 parser splits the output into the expected set of cookies", () => {
            const headers = headersWithSetCookies([
                "route=kong-upstream-7f3a; Path=/",
                "pubkey=app-issued-xyz789; Max-Age=600",
            ]);
            const cookieHeader = cookieFromSetCookies(headers);

            // Parse the way a strict receiver (Kong, RFC 6265 server) would.
            const parsed: Record<string, string> = {};
            for (const pair of cookieHeader!.split(";")) {
                const eq = pair.indexOf("=");
                if (eq < 0) continue;
                parsed[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
            }

            expect(parsed).to.deep.equal({
                route: "kong-upstream-7f3a",
                pubkey: "app-issued-xyz789",
            });
        });
    });
});
