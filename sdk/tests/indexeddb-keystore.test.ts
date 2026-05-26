import sinon from "sinon";
import { expect } from "chai";
import {
    IndexedDBKeyStore,
    InvalidLocatorError,
    ProvingKeyLocator,
} from "../src/node.js";

// Helper: build a minimal valid ProvingKeyLocator, allowing field overrides.
function locator(overrides: Partial<ProvingKeyLocator> = {}): ProvingKeyLocator {
    return {
        program: "credits.aleo",
        functionName: "transfer_private",
        edition: 1,
        amendment: 0,
        network: "mainnet",
        keyType: "prover",
        ...overrides,
    };
}

// Helper: install / uninstall a stub `indexedDB` on globalThis.
function withIndexedDBStub(stub: any, fn: () => Promise<void>): Promise<void> {
    const g = globalThis as any;
    const had = "indexedDB" in g;
    const prior = g.indexedDB;
    g.indexedDB = stub;
    return fn().finally(() => {
        if (had) g.indexedDB = prior;
        else delete g.indexedDB;
    });
}

describe("IndexedDBKeyStore", () => {
    afterEach(() => {
        sinon.restore();
        // Defensive cleanup in case a test threw before its finally.
        const g = globalThis as any;
        if (g.__indexedDBStubInstalled) {
            delete g.indexedDB;
            delete g.__indexedDBStubInstalled;
        }
    });

    describe("environment guard", () => {
        it("rejects with a clear error when indexedDB is undefined", async () => {
            const g = globalThis as any;
            const had = "indexedDB" in g;
            const prior = g.indexedDB;
            if (had) delete g.indexedDB;
            try {
                const store = new IndexedDBKeyStore("smoke-test");
                let err: Error | undefined;
                try {
                    await store.getKeyBytes(locator());
                } catch (e) {
                    err = e as Error;
                }
                expect(err, "expected getKeyBytes to reject").to.exist;
                expect(err!.message).to.match(/indexedDB/i);
                expect(err!.message).to.match(/browser|Web Worker|SSR|Node/i);
            } finally {
                if (had) g.indexedDB = prior;
            }
        });
    });

    describe("locator validation (pre-IndexedDB)", () => {
        // These tests don't need a real IndexedDB — validation throws before openDB.
        let store: IndexedDBKeyStore;
        beforeEach(() => {
            store = new IndexedDBKeyStore("locator-test");
        });

        it("rejects empty program component", async () => {
            let err: any;
            try {
                await store.has(locator({ program: "" }));
            } catch (e) { err = e; }
            expect(err).to.be.instanceOf(InvalidLocatorError);
            expect(err.reason).to.equal("reserved_name");
        });

        it("rejects \".\" component", async () => {
            let err: any;
            try {
                await store.has(locator({ functionName: "." }));
            } catch (e) { err = e; }
            expect(err).to.be.instanceOf(InvalidLocatorError);
            expect(err.reason).to.equal("reserved_name");
        });

        it("rejects path-traversal component", async () => {
            let err: any;
            try {
                await store.has(locator({ program: "../etc" }));
            } catch (e) { err = e; }
            expect(err).to.be.instanceOf(InvalidLocatorError);
            expect(err.reason).to.equal("path_traversal");
        });

        it("rejects path separators in component", async () => {
            let err: any;
            try {
                await store.has(locator({ functionName: "a/b" }));
            } catch (e) { err = e; }
            expect(err).to.be.instanceOf(InvalidLocatorError);
            expect(err.reason).to.equal("path_separator");
        });

        it("rejects null byte in component", async () => {
            let err: any;
            try {
                await store.has(locator({ network: "main\0net" }));
            } catch (e) { err = e; }
            expect(err).to.be.instanceOf(InvalidLocatorError);
            expect(err.reason).to.equal("path_separator");
        });

        it("rejects negative edition", async () => {
            let err: any;
            try {
                await store.has(locator({ edition: -1 }));
            } catch (e) { err = e; }
            expect(err).to.be.instanceOf(InvalidLocatorError);
            expect(err.reason).to.equal("negative_value");
        });

        it("rejects non-integer amendment", async () => {
            let err: any;
            try {
                await store.has(locator({ amendment: 0.5 }));
            } catch (e) { err = e; }
            expect(err).to.be.instanceOf(InvalidLocatorError);
            expect(err.reason).to.equal("negative_value");
        });
    });

    describe("openDB error recovery", () => {
        // Verifies the cached dbPromise is cleared on error/blocked so a subsequent
        // call gets a fresh attempt rather than being permanently poisoned.
        it("retries open after an initial error", async () => {
            let callCount = 0;
            const stub = {
                open(_name: string, _version: number) {
                    callCount += 1;
                    const req: any = { onerror: null, onsuccess: null, onupgradeneeded: null, onblocked: null };
                    // First call errors; subsequent calls succeed with a dummy DB.
                    setTimeout(() => {
                        if (callCount === 1) {
                            req.error = new Error("simulated open error");
                            req.onerror && req.onerror();
                        } else {
                            req.result = { transaction: () => { throw new Error("not used in this test"); } };
                            req.onsuccess && req.onsuccess();
                        }
                    }, 0);
                    return req;
                },
            };

            await withIndexedDBStub(stub, async () => {
                const store = new IndexedDBKeyStore("retry-test");

                // First call should reject.
                let err1: Error | undefined;
                try {
                    await store.has(locator());
                } catch (e) {
                    err1 = e as Error;
                }
                expect(err1, "first call should reject").to.exist;
                expect(err1!.message).to.match(/simulated open error/);
                expect(callCount).to.equal(1);

                // Second call should reach indexedDB.open again (cache cleared).
                // We expect a different error here (txn stub throws), but the key
                // assertion is that callCount increments — proving the promise
                // wasn't poisoned.
                try {
                    await store.has(locator());
                } catch {
                    // expected — txn stub is intentionally minimal
                }
                expect(callCount, "openDB should retry after error").to.equal(2);
            });
        });

        it("rejects with AbortError when open is blocked", async () => {
            const stub = {
                open(_name: string, _version: number) {
                    const req: any = { onerror: null, onsuccess: null, onupgradeneeded: null, onblocked: null };
                    setTimeout(() => req.onblocked && req.onblocked(), 0);
                    return req;
                },
            };

            await withIndexedDBStub(stub, async () => {
                const store = new IndexedDBKeyStore("blocked-test");
                let err: any;
                try {
                    await store.has(locator());
                } catch (e) { err = e; }
                expect(err).to.exist;
                expect(err.name).to.equal("AbortError");
            });
        });
    });
});
