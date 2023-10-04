import { useEffect, useState, ReactNode } from "react";
import WorkerContext from "./WorkerContext.js";

const WorkerProvider : React.FC<{ children: ReactNode }> = ({ children }) => {
    const [worker, setWorker] = useState<Worker | null>(null);
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
