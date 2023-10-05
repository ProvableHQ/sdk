import wasm from "../Cargo.toml";

async function initializeWorker(wasm) {
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

    const exports = await initWasm({
        initializeHook: (init, path) => init(module, memory),
    });

    postMessage(null);

    exports.initializeWorker(address);

    close();
}

await initializeWorker(wasm);
