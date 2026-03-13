//@ts-nocheck
import { wrap } from "comlink";

let singletonWorker = null;
let workerReady: Promise<void> | null = null;

const AleoWorker = () => {
    if (!singletonWorker) {
        const worker = new Worker(new URL("worker", import.meta.url), {
            type: "module",
        });

        worker.onerror = function (event) {
            console.error("Error in worker: " + event?.message);
        };

        // Wait for worker to signal it's ready before wrapping
        workerReady = new Promise<void>((resolve) => {
            const handleMessage = (event: MessageEvent) => {
                if (event.data === "ready") {
                    console.log("[AleoWorker] Worker signaled ready");
                    worker.removeEventListener("message", handleMessage);
                    resolve();
                }
            };
            worker.addEventListener("message", handleMessage);
        });

        // Wrap after ready signal
        workerReady.then(() => {
            singletonWorker = wrap(worker);
        });
    }
    return singletonWorker;
};

// Get a promise that resolves to the worker when it's ready
const getAleoWorker = async () => {
    AleoWorker(); // Initialize if needed
    await workerReady;
    return singletonWorker;
};

export { AleoWorker, getAleoWorker };
