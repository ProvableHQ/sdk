"use client";

import Image from "next/image";
import styles from "./page.module.css";
import { useCallback, useEffect, useRef, useState } from "react";

export default function Home() {
    const [account, setAccount] = useState(null);
    const [executing, setExecuting] = useState(false);

    const generateAccount = async () => {
        workerRef.current?.postMessage("key");
    };

    async function execute() {
        setExecuting(true);
        workerRef.current?.postMessage("execute");
    }

    const workerRef = useRef<Worker>();

    interface AleoWorkerMessageEvent {
        type: string;
        result: any;
    }

    useEffect(() => {
        workerRef.current = new Worker(new URL("worker.ts", import.meta.url));
        workerRef.current.onmessage = (
            event: MessageEvent<AleoWorkerMessageEvent>
        ) => {
            if (event.data.type === "key") {
                setAccount(event.data.result);
            } else if (event.data.type === "execute") {
                setExecuting(false);
            }
            alert(`WebWorker Response => ${event.data.result}`);
        };
        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    const handleWork = useCallback(async () => {
        workerRef.current?.postMessage("execute");
    }, []);

    return (
        <main className={styles.main}>
            <div className={styles.description}>
                <p>
                    Get started by editing&nbsp;
                    <code className={styles.code}>src/app/page.tsx</code>
                </p>
            </div>

            <div className={styles.center}>
                <Image
                    className={styles.logo}
                    src="/next.svg"
                    alt="Next.js Logo"
                    width={180}
                    height={37}
                    priority
                />
                <Image
                    className={styles.logo}
                    src="/aleo.svg"
                    alt="Next.js Logo"
                    width={180}
                    height={45}
                    priority
                />
            </div>

            <div className={styles.card}>
                <p>
                    <button onClick={generateAccount}>
                        {account
                            ? `Account is ${JSON.stringify(account)}`
                            : `Click to generate account`}
                    </button>
                </p>
                <p>
                    <button disabled={executing} onClick={execute}>
                        {executing
                            ? `Executing...check console for details...`
                            : `Execute helloworld.aleo`}
                    </button>
                </p>
            </div>
        </main>
    );
}
