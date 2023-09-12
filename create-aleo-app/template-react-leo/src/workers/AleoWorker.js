import { wrap } from "comlink";

let singletonWorker = null;

const AleoWorker = () => {
    if (!singletonWorker) {
        const worker = new Worker(new URL("worker.js", import.meta.url), {
            type: "module",
        });
        singletonWorker = wrap(worker);
    }
    return singletonWorker;
};

export { AleoWorker };