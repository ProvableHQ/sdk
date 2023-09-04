import { useEffect, useState } from "react";
import WorkerContext from "./WorkerContext";

const WorkerProvider = ({ children }) => {
    const [worker, setWorker] = useState(null);
    const [workerReady, setWorkerReady] = useState(false);

    useEffect(() => {
        let worker = new Worker(new URL("./worker.js", import.meta.url), {
            type: "module",
        });
        setWorker(worker);

        worker.onmessage = (event) => {
            if (event.data.type === "ALEO_WORKER_READY") {
                setWorkerReady(true);
            }
        };

        return () => {
            worker.terminate();
        };
    }, []);

    return (
        <WorkerContext.Provider value={worker}>
            {children}
        </WorkerContext.Provider>
    );
};

export default WorkerProvider;
