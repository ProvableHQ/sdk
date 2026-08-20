import { expect } from "chai";
import { ApiAuth, normalizeAuthConfig } from "../src/api-auth";
import { RecordScanner } from "../src/record-scanner";

type Call = { url: string; headers: Record<string, string>; method?: string };

function stubTransport(calls: Call[], respond?: (url: string) => Response) {
    return async (input: any, init?: any): Promise<Response> => {
        const url = String(input);
        const headers: Record<string, string> = {};
        new Headers(init?.headers ?? {}).forEach((value, key) => { headers[key] = value; });
        calls.push({ url, headers, method: init?.method });
        if (respond) return respond(url);
        return new Response("{}", { status: 200 });
    };
}

function jwtMintResponse(jwt: string, expSeconds: number): Response {
    return new Response(JSON.stringify({ exp: expSeconds }), {
        status: 201,
        headers: { authorization: jwt },
    });
}

describe("normalizeAuthConfig", () => {
    it("selects jwt mode from a string apiKey and consumerId", () => {
        const config = normalizeAuthConfig({ apiKey: "key", consumerId: "cid" });
        expect(config).to.deep.equal({ mode: "jwt", apiKey: "key", consumerId: "cid", jwtData: undefined });
    });

    it("selects api-key mode from a custom-header apiKey", () => {
        const config = normalizeAuthConfig({ apiKey: { header: "X-API-Key", value: "edge-key" } });
        expect(config).to.deep.equal({ mode: "api-key", value: "edge-key", header: "X-API-Key" });
    });

    it("selects none when nothing is configured", () => {
        expect(normalizeAuthConfig({})).to.deep.equal({ mode: "none" });
    });

    it("throws when a custom-header apiKey is combined with a consumerId", () => {
        expect(() => normalizeAuthConfig({
            apiKey: { header: "X-API-Key", value: "edge-key" },
            consumerId: "cid",
        })).to.throw(/consumerId/);
    });

    it("throws when explicit auth is combined with legacy fields", () => {
        expect(() => normalizeAuthConfig({
            auth: { mode: "api-key", value: "edge-key" },
            consumerId: "cid",
        })).to.throw(/not both/);
    });

    it("throws when api-key mode has no value", () => {
        expect(() => normalizeAuthConfig({ auth: { mode: "api-key", value: "" } })).to.throw(/provisioned/);
    });
});

describe("ApiAuth", () => {
    it("api-key mode sends the key header and never mints", async () => {
        const calls: Call[] = [];
        const auth = new ApiAuth({ mode: "api-key", value: "edge-key" }, "https://edge.example", stubTransport(calls));
        const headers = await auth.headers();
        expect(headers).to.deep.equal({ "X-API-Key": "edge-key" });
        expect(calls).to.have.length(0);
    });

    it("api-key mode honors a custom header name", async () => {
        const auth = new ApiAuth({ mode: "api-key", value: "k", header: "X-Edge-Key" }, "https://edge.example", stubTransport([]));
        expect(await auth.headers()).to.deep.equal({ "X-Edge-Key": "k" });
    });

    it("none mode sends nothing", async () => {
        const auth = new ApiAuth({ mode: "none" }, "https://api.example", stubTransport([]));
        expect(await auth.headers()).to.deep.equal({});
    });

    it("jwt mode mints once at /jwts/{consumerId} and reuses the fresh token", async () => {
        const calls: Call[] = [];
        const exp = Math.floor(Date.now() / 1000) + 3600;
        const transport = stubTransport(calls, () => jwtMintResponse("Bearer fresh", exp));
        const auth = new ApiAuth({ mode: "jwt", apiKey: "key", consumerId: "cid" }, "https://api.example", transport);
        expect(await auth.headers()).to.deep.equal({ Authorization: "Bearer fresh" });
        expect(await auth.headers()).to.deep.equal({ Authorization: "Bearer fresh" });
        expect(calls).to.have.length(1);
        expect(calls[0].url).to.equal("https://api.example/jwts/cid");
        expect(calls[0].headers["x-provable-api-key"]).to.equal("key");
    });

    it("jwt mode refreshes a stale token", async () => {
        const calls: Call[] = [];
        const exp = Math.floor(Date.now() / 1000) + 3600;
        const transport = stubTransport(calls, () => jwtMintResponse("Bearer fresh", exp));
        const stale = { jwt: "Bearer stale", expiration: Date.now() + 1000 };
        const auth = new ApiAuth({ mode: "jwt", apiKey: "key", consumerId: "cid", jwtData: stale }, "https://api.example", transport);
        expect(await auth.headers()).to.deep.equal({ Authorization: "Bearer fresh" });
        expect(calls).to.have.length(1);
    });

    it("jwt mode deduplicates concurrent mints", async () => {
        const calls: Call[] = [];
        const exp = Math.floor(Date.now() / 1000) + 3600;
        const transport = stubTransport(calls, () => jwtMintResponse("Bearer fresh", exp));
        const auth = new ApiAuth({ mode: "jwt", apiKey: "key", consumerId: "cid" }, "https://api.example", transport);
        await Promise.all([auth.headers(), auth.headers(), auth.headers()]);
        expect(calls).to.have.length(1);
    });

    it("jwt mode without mint material sends a stale token rather than nothing", async () => {
        const stale = { jwt: "Bearer stale", expiration: Date.now() - 1000 };
        const auth = new ApiAuth({ mode: "jwt", jwtData: stale }, "https://api.example", stubTransport([]));
        expect(await auth.headers()).to.deep.equal({ Authorization: "Bearer stale" });
    });
});

describe("RecordScanner auth modes", () => {
    it("api-key mode sends X-API-Key and never touches /jwts", async () => {
        const calls: Call[] = [];
        const scanner = new RecordScanner({
            url: "https://edge.example/api/scanner",
            auth: { mode: "api-key", value: "edge-key" },
            transport: stubTransport(calls, () => new Response(JSON.stringify({ height: 1 }), { status: 200 })),
        });
        await scanner.status("123field");
        expect(calls).to.have.length(1);
        expect(calls[0].headers["x-api-key"]).to.equal("edge-key");
        expect(calls[0].headers).to.not.have.property("authorization");
        expect(calls[0].url).to.not.include("/jwts/");
    });

    it("legacy string apiKey + consumerId mints a JWT and echoes the raw key header", async () => {
        const calls: Call[] = [];
        const exp = Math.floor(Date.now() / 1000) + 3600;
        const transport = stubTransport(calls, (url) =>
            url.includes("/jwts/")
                ? jwtMintResponse("Bearer minted", exp)
                : new Response(JSON.stringify({ height: 1 }), { status: 200 }));
        const scanner = new RecordScanner({
            url: "https://api.example/scanner",
            apiKey: "legacy-key",
            consumerId: "cid",
            transport,
        });
        await scanner.status("123field");
        expect(calls[0].url).to.equal("https://api.example/jwts/cid");
        const scanCall = calls[1];
        expect(scanCall.headers["authorization"]).to.equal("Bearer minted");
        expect(scanCall.headers["x-provable-api-key"]).to.equal("legacy-key");
    });

    it("throws at construction when explicit auth is combined with a legacy apiKey", () => {
        expect(() => new RecordScanner({
            url: "https://edge.example/api/scanner",
            auth: { mode: "none" },
            apiKey: "leftover-key",
        })).to.throw(/not both/);
    });

    it("rejects legacy mutators once an explicit auth mode is set", () => {
        const scanner = new RecordScanner({
            url: "https://edge.example/api/scanner",
            auth: { mode: "api-key", value: "edge-key" },
        });
        expect(() => scanner.setConsumerId("cid")).to.throw(/setAuth/);
        expect(() => scanner.setApiKey("k")).to.throw(/setAuth/);
    });

    it("throws at construction for api-key auth combined with a consumerId", () => {
        expect(() => new RecordScanner({
            url: "https://edge.example/api/scanner",
            apiKey: { header: "X-API-Key", value: "edge-key" },
            consumerId: "cid",
        })).to.throw(/consumerId/);
    });
});

describe("AleoNetworkClient explicit jwt auth", () => {
    it("reuses the cached JWT across proving submissions instead of re-minting", async () => {
        const { AleoNetworkClient } = await import("../src/node");
        const calls: Call[] = [];
        const exp = Math.floor(Date.now() / 1000) + 3600;
        const transport = stubTransport(calls, (url) =>
            url.includes("/jwts/") ? jwtMintResponse("Bearer minted", exp) : new Response("{}", { status: 200 }));
        const client = new AleoNetworkClient("https://api.example/v2", {
            transport,
            auth: { mode: "jwt", apiKey: "key", consumerId: "cid" },
        });
        // The proving request is garbage on purpose: parsing happens after the
        // auth headers resolve, so each attempt still exercises one auth cycle.
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                await client.submitProvingRequestSafe({ provingRequest: "not-a-proving-request" });
            } catch {
                // parse failure expected
            }
        }
        const mints = calls.filter((c) => c.url.includes("/jwts/"));
        expect(mints).to.have.length(1);
    });

    it("mints a fresh JWT when per-request auth names a different consumer", async () => {
        const { AleoNetworkClient } = await import("../src/node");
        const calls: Call[] = [];
        const exp = Math.floor(Date.now() / 1000) + 3600;
        const transport = stubTransport(calls, (url) =>
            url.includes("/jwts/") ? jwtMintResponse("Bearer minted", exp) : new Response("{}", { status: 200 }));
        const client = new AleoNetworkClient("https://api.example/v2", {
            transport,
            auth: { mode: "jwt", apiKey: "key-a", consumerId: "consumer-a" },
        });
        const submit = async (auth?: any) => {
            try {
                await client.submitProvingRequestSafe({ provingRequest: "not-a-proving-request", ...(auth ? { auth } : {}) });
            } catch {
                // parse failure expected
            }
        };
        await submit();
        await submit({ mode: "jwt", apiKey: "key-b", consumerId: "consumer-b" });
        const mints = calls.filter((c) => c.url.includes("/jwts/")).map((c) => c.url);
        expect(mints).to.deep.equal([
            "https://api.example/jwts/consumer-a",
            "https://api.example/jwts/consumer-b",
        ]);
    });
});
