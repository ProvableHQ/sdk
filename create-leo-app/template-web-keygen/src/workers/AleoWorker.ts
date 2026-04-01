import { wrap } from "comlink";

let singletonWorker: any = null;

export const AleoWorker = () => {
  if (!singletonWorker) {
    const worker = new Worker(new URL("worker", import.meta.url), {
      type: "module",
    });
    singletonWorker = wrap(worker);
  }
  return singletonWorker;
};
