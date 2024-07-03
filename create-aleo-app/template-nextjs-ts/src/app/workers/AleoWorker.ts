import { wrap } from "comlink";

let singletonWorker:any = null;

const AleoWorker = () => {
    if (!singletonWorker && typeof window !== "undefined") {
        const worker = new Worker(new URL("worker", import.meta.url), {
            type: "module",
        });
        worker.onerror = function(event) {
            console.error("Error in worker:", event.message);
        };
        singletonWorker = wrap(worker);
    }
    return singletonWorker;
};

export { AleoWorker };
