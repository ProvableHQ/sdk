import wasm from "../dist/wasm.js";

async function initializeWorker(wasm) {
    // Wait for the main thread to send us the Module, Memory, and Rayon thread pointer.
    function wait() {
        return new Promise((resolve) => {
            addEventListener("message", (event) => {
                resolve(event.data);
            }, {
                capture: true,
                once: true,
            });
        });
    }

    const [initWasm, { module, memory, address }] = await Promise.all([
        wasm,
        wait(),
    ]);

    // Runs the Wasm inside of the Worker, but using the main thread's Module and Memory.
    const exports = await initWasm({
        initializeHook: (init, path) => init(module, memory),
    });

    // Tells the main thread that we're finished initializing.
    postMessage(null);

    // This will hang the Worker while running the Rayon thread.
    exports.runRayonThread(address);

    // When the Rayon thread is finished, close the Worker.
    close();
}

await initializeWorker(wasm);
