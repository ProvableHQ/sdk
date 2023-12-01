import { wrap } from "comlink";

let singletonWorker = null;

const AleoWorker = () => {
    if (!singletonWorker) {
        const worker = new Worker(new URL("worker.js", import.meta.url), {
            type: "module",
        });

        worker.onerror = function(event) {
            console.error("Error in worker: " + event?.message);
        };

        singletonWorker = wrap(worker);
    }
    return singletonWorker;
};

export { AleoWorker };