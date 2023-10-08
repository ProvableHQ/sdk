function patch($worker: typeof import("node:worker_threads"), $os: typeof import("node:os")) {
    // This is technically not a part of the Worker polyfill,
    // but Workers are used for multi-threading, so this is often
    // needed when writing Worker code.
    if (globalThis.navigator == null) {
        globalThis.navigator = {
            hardwareConcurrency: $os.cpus().length,
        } as Navigator;
    }

    globalThis.Worker = class Worker extends EventTarget {
        private _worker: import("node:worker_threads").Worker;

        constructor(url: string | URL, options?: WorkerOptions | undefined) {
            super();

            if (url instanceof URL) {
                if (url.protocol !== "file:") {
                    throw new Error("Worker only supports file: URLs");
                }

                url = url.href;

            } else {
                throw new Error("Filepaths are unreliable, use `new URL(\"...\", import.meta.url)` instead.");
            }

            if (!options || options.type !== "module") {
                throw new Error("Workers must use \`type: \"module\"\`");
            }

            // This uses some funky stuff like `patch.toString()`.
            //
            // This is needed so that it can synchronously run the polyfill code
            // inside of the worker.
            //
            // It can't use `require` because the file doesn't have a `.cjs` file extension.
            //
            // It can't use `import` because that's asynchronous, and the file path
            // might be different if using a bundler.
            const code = `
                ${patch.toString()}

                // Inject the polyfill into the worker
                patch(require("node:worker_threads"), require("node:os"));

                const { workerData } = require("node:worker_threads");

                // This actually loads and runs the worker file
                import(workerData.url)
                    .catch((e) => {
                        // TODO maybe it should send a message to the parent?
                        console.error(e.stack);
                    });
            `;

            this._worker = new $worker.Worker(code, {
                eval: true,
                workerData: {
                    url,
                },
            });

            this._worker.on("message", (data) => {
                this.dispatchEvent(new MessageEvent("message", { data }));
            });

            this._worker.on("messageerror", (error) => {
                throw new Error("UNIMPLEMENTED");
            });

            this._worker.on("error", (error) => {
                // TODO attach the error to the event somehow
                const event = new Event("error");
                this.dispatchEvent(event);
            });
        }

        set onmessage(f: () => void) {
            throw new Error("UNIMPLEMENTED");
        }

        set onmessageerror(f: () => void) {
            throw new Error("UNIMPLEMENTED");
        }

        set onerror(f: () => void) {
            throw new Error("UNIMPLEMENTED");
        }

        postMessage(message: any, transfer: Array<Transferable>): void;
        postMessage(message: any, options?: StructuredSerializeOptions | undefined): void;
        postMessage(value: any, transfer: any) {
            this._worker.postMessage(value, transfer);
        }

        terminate() {
            this._worker.terminate();
        }

        // This is Node-specific, it allows the process to exit
        // even if the Worker is still running.
        unref() {
            this._worker.unref();
        }
    };


    if (!$worker.isMainThread) {
        const globals = globalThis as unknown as DedicatedWorkerGlobalScope;

        // This is used to create the onmessage, onmessageerror, and onerror setters
        const makeSetter = (prop: string, event: string) => {
            let oldvalue: () => void;

            Object.defineProperty(globals, prop, {
                get() {
                    return oldvalue;
                },
                set(value) {
                    if (oldvalue) {
                        globals.removeEventListener(event, oldvalue);
                    }

                    oldvalue = value;

                    if (oldvalue) {
                        globals.addEventListener(event, oldvalue);
                    }
                },
            });
        };

        // This makes sure that `f` is only run once
        const memoize = (f: () => void) => {
            let run = false;

            return () => {
                if (!run) {
                    run = true;
                    f();
                }
            };
        };


        // We only start listening for messages / errors when the worker calls addEventListener
        const startOnMessage = memoize(() => {
            $worker.parentPort!.on("message", (data) => {
                workerEvents.dispatchEvent(new MessageEvent("message", { data }));
            });
        });

        const startOnMessageError = memoize(() => {
            throw new Error("UNIMPLEMENTED");
        });

        const startOnError = memoize(() => {
            $worker.parentPort!.on("error", (data) => {
                workerEvents.dispatchEvent(new Event("error"));
            });
        });


        // Node workers don't have top-level events, so we have to make our own
        const workerEvents = new EventTarget();

        globals.close = () => {
            process.exit();
        };

        globals.addEventListener = (type: string, callback: EventListenerOrEventListenerObject | null, options?: boolean | EventListenerOptions | undefined) => {
            workerEvents.addEventListener(type, callback, options);

            if (type === "message") {
                startOnMessage();
            } else if (type === "messageerror") {
                startOnMessageError();
            } else if (type === "error") {
                startOnError();
            }
        };

        globals.removeEventListener = (type: string, callback: EventListenerOrEventListenerObject | null, options?: boolean | EventListenerOptions | undefined) => {
            workerEvents.removeEventListener(type, callback, options);
        };

        function postMessage(message: any, transfer: Transferable[]): void;
        function postMessage(message: any, options?: StructuredSerializeOptions | undefined): void;
        function postMessage(value: any, transfer: any) {
            $worker.parentPort!.postMessage(value, transfer);
        }

        globals.postMessage = postMessage;

        makeSetter("onmessage", "message");
        makeSetter("onmessageerror", "messageerror");
        makeSetter("onerror", "error");
    }
}


async function polyfill() {
    const [$worker, $os] = await Promise.all([
        import("node:worker_threads"),
        import("node:os"),
    ]);

    patch($worker, $os);
}

if (globalThis.Worker == null) {
    await polyfill();
}

export {};
