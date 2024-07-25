// Experimental example where SDK manages worker

import { wrap } from "comlink";
import { WorkerAPI } from './worker';

let singletonWorker: WorkerAPI | null = null;

const createAleoWorker = (): WorkerAPI => {
    if (!singletonWorker) {
        const worker = new Worker(new URL("worker.js", import.meta.url), {
            type: "module",
        });
        singletonWorker = wrap<WorkerAPI>(worker);
    }
    return singletonWorker;
};

export { createAleoWorker };