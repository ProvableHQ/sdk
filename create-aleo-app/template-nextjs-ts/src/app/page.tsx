"use client";

import Image from "next/image";
import styles from "./page.module.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { AleoWorker } from './workers/AleoWorker'; 
import program_data from "../../helloworld/build/main.aleo?raw";
const aleoWorker = AleoWorker();

export default function Home() {
    const [account, setAccount] = useState(null);
    const [executing, setExecuting] = useState(false);

    const generateAccount = async () => {
        const key = await aleoWorker.getPrivateKey();
        setAccount(key);
    };

    const execute = async () => {
        setExecuting(true);
        const result = await aleoWorker.localProgramExecution(
            program_data,
            "main",
            ["3u32", "5u32"],
          );
        setExecuting(false);
        alert(`Execution Result: ${result}`);
    };

    
    const deploy = async () => {
        setExecuting(true);
        const deploymentResult = await aleoWorker.deployProgram(program_data);
        setExecuting(false);
        alert(`Deployment Result: ${deploymentResult}`);
    };

    return (
        <main className={styles.main}>
            <div className={styles.description}>
                <p>Get started by editing <code className={styles.code}>src/app/page.tsx</code></p>
            </div>

            <div className={styles.center}>
                <Image className={styles.logo} src="/next.svg" alt="Next.js Logo" width={180} height={37} priority />
                <Image className={styles.logo} src="/aleo.svg" alt="Aleo Logo" width={180} height={45} priority />
            </div>

            <div className={styles.card}>
                <p>
                    <button onClick={generateAccount}>
                        {account ? `Account is ${account}` : `Click to generate account`}
                    </button>
                </p>
                <p>
                    <button disabled={executing} onClick={execute}>
                        {executing ? `Executing...` : `Execute helloworld.aleo`}
                    </button>
                </p>
                <p>
                    <button disabled={executing} onClick={deploy}>
                        {executing ? `Deploying...` : `Deploy Helloworld.aleo`}
                    </button>
                </p>
            </div>
        </main>
    );
}
