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

        it("does not poison the cache: retries env check after indexedDB becomes defined", async () => {
            const g = globalThis as any;
            const had = "indexedDB" in g;
            const prior = g.indexedDB;
            if (had) delete g.indexedDB;
            try {
                const store = new IndexedDBKeyStore("late-polyfill-test");

                // First call: indexedDB undefined → should reject.
                let err1: Error | undefined;
                try {
                    await store.has(locator());
                } catch (e) { err1 = e as Error; }
                expect(err1, "first call should reject").to.exist;
                expect(err1!.message).to.match(/indexedDB/i);

                // Simulate a polyfill loading after the first failed call.
                let openCallCount = 0;
                g.indexedDB = {
                    open(_name: string, _version: number) {
                        openCallCount += 1;
                        const req: any = { onerror: null, onsuccess: null, onupgradeneeded: null, onblocked: null };
                        setTimeout(() => req.onblocked && req.onblocked(), 0);
                        return req;
                    },
                };

                // Second call: indexedDB now defined → should reach indexedDB.open
                // rather than re-using the cached rejection.
                try {
                    await store.has(locator());
                } catch {
                    // expected — blocked stub fires AbortError
                }
                expect(openCallCount, "openDB should retry after env check now passes").to.equal(1);
            } finally {
                if (had) g.indexedDB = prior;
                else delete g.indexedDB;
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

        it("closes a connection that opens after the blocked open was rejected", async () => {
            // Rejecting a blocked open does not cancel the request: it can
            // still succeed once the blocking connection closes. That late
            // connection has no owner, so it must be closed, not leaked.
            const close = sinon.spy();
            let request: any;
            const stub = {
                open(_name: string, _version: number) {
                    request = { onerror: null, onsuccess: null, onupgradeneeded: null, onblocked: null };
                    setTimeout(() => request.onblocked(), 0);
                    return request;
                },
            };

            await withIndexedDBStub(stub, async () => {
                const store = new IndexedDBKeyStore("late-open-test");
                try {
                    await store.has(locator());
                } catch {
                    // expected — blocked
                }
                request.result = { close, transaction: () => { throw new Error("not used"); } };
                request.onsuccess();
                expect(close.calledOnce, "late connection should be closed").to.equal(true);
            });
        });

        it("closes its connection and reopens when another context upgrades the database", async () => {
            const close = sinon.spy();
            const dbs: any[] = [];
            const stub = {
                open(_name: string, _version: number) {
                    const req: any = { onerror: null, onsuccess: null, onupgradeneeded: null, onblocked: null };
                    setTimeout(() => {
                        const db: any = { close, transaction: () => { throw new Error("not used"); } };
                        dbs.push(db);
                        req.result = db;
                        req.onsuccess();
                    }, 0);
                    return req;
                },
            };

            await withIndexedDBStub(stub, async () => {
                const store = new IndexedDBKeyStore("versionchange-test");
                try { await store.has(locator()); } catch { /* txn stub */ }
                expect(dbs).to.have.length(1);
                expect(dbs[0].onversionchange, "connection should listen for versionchange").to.be.a("function");

                dbs[0].onversionchange();
                expect(close.calledOnce, "connection should close so the upgrade can proceed").to.equal(true);

                // The next call reopens instead of using the closed connection.
                try { await store.has(locator()); } catch { /* txn stub */ }
                expect(dbs).to.have.length(2);
            });
        });
    });

    describe("schema", () => {
        // Opens the store against a stub that runs one upgrade, then fails the
        // open so the test can inspect what the upgrade did.
        async function upgrade(existingStore: boolean) {
            const createIndex = sinon.spy();
            const keys = { indexNames: { contains: () => false }, createIndex };
            const createObjectStore = sinon.stub().returns(keys);
            const opened: number[] = [];
            await withIndexedDBStub({
                open(_name: string, version: number) {
                    opened.push(version);
                    const request: any = {
                        result: {
                            objectStoreNames: { contains: () => existingStore },
                            createObjectStore,
                        },
                        transaction: { objectStore: () => keys },
                        error: new Error("stop after upgrade"),
                    };
                    setTimeout(() => {
                        request.onupgradeneeded();
                        request.onerror();
                    }, 0);
                    return request;
                },
            }, async () => {
                try {
                    await new IndexedDBKeyStore("schema-test").has(locator());
                } catch {
                    // expected — the stub fails the open after the upgrade
                }
            });
            return { opened, createObjectStore, createIndex };
        }

        it("creates the key store with a size index", async () => {
            const { opened, createObjectStore, createIndex } = await upgrade(false);
            expect(opened).to.deep.equal([IndexedDBKeyStore.DB_VERSION]);
            expect(IndexedDBKeyStore.DB_VERSION).to.equal(2);
            expect(createObjectStore.calledOnceWith("keys", { keyPath: "locator" })).to.equal(true);
            expect(createIndex.calledOnceWith("metadata.size", "metadata.size")).to.equal(true);
        });

        it("adds the size index to a version 1 key store", async () => {
            const { createObjectStore, createIndex } = await upgrade(true);
            expect(createObjectStore.called).to.equal(false);
            expect(createIndex.calledOnceWith(IndexedDBKeyStore.SIZE_INDEX, IndexedDBKeyStore.SIZE_INDEX)).to.equal(true);
        });
    });
});
