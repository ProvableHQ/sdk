import { initThreadPool, PrivateKey, verifyFunctionExecution } from "./browser";
import { WorkerImpl } from "../shared/worker";

class TestnetWorker extends WorkerImpl {
    from_string(key: string): any {
        return PrivateKey.from_string(key);
    }

    to_string(): string {
        const privateKey = new PrivateKey();
        return privateKey.to_string();
    }

    verifyFunctionExecution(execution: any, verifying_key: any, program: any, function_id: string): boolean {
        return verifyFunctionExecution(execution, verifying_key, program, function_id);
    }
}

await initThreadPool();

new TestnetWorker().init();
