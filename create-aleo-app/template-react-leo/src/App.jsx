import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import aleoLogo from "./assets/aleo.svg";
import "./App.css";
import { useAleoWASM } from "./aleo-wasm-hook";
import helloworld_program from '../helloworld/build/main.aleo?raw';

function App() {
  const [count, setCount] = useState(0);
  const [aleo, aleoLoading] = useAleoWASM();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateAccount = () => {
    setAccount(new aleo.PrivateKey());
  };

  const [worker, setWorker] = useState(null);

  useEffect(() => {
    if (worker === null) {
      const spawnedWorker = spawnWorker();
      setWorker(spawnedWorker);
      return () => {
        spawnedWorker.terminate();
      };
    }
  }, []);

  function spawnWorker() {
    return new Worker(new URL("workers/worker.js", import.meta.url), {
      type: "module",
    });
  }

  function postMessagePromise(worker, message) {
    return new Promise((resolve, reject) => {
      worker.onmessage = (event) => {
        resolve(event.data);
      };
      worker.onerror = (error) => {
        reject(error);
      };
      worker.postMessage(message);
    });
  }

  async function execute() {
    setLoading(true);
    const result = await postMessagePromise(worker, {
      type: "ALEO_EXECUTE_PROGRAM_LOCAL",
      localProgram: helloworld_program,
      aleoFunction: "main",
      inputs: ["5u32", "5u32"],
      privateKey: account.to_string(),
    });
    setLoading(false);

    alert(JSON.stringify(result));
  }

  return (
    <>
      <div>
        <a href="https://aleo.org" target="_blank">
          <img src={aleoLogo} className="logo" alt="Aleo logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Aleo + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          <button disabled={aleoLoading} onClick={generateAccount}>
            {aleoLoading
                ? "Aleo WASM loading..."
                : (account
                    ? `Account is ${JSON.stringify(account.to_string())}`
                    : `Click to generate account`)
            }
          </button>
        </p>
        <p>
          <button disabled={!account || loading} onClick={execute}>
            {loading
              ? `Executing...check console for details...`
              : `Execute helloworld.aleo`}
          </button>
        </p>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Aleo and React logos to learn more
      </p>
    </>
  );
}

export default App;
