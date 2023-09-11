import { useState } from "react";
import reactLogo from "./assets/react.svg";
import aleoLogo from "./assets/aleo.svg";
import "./App.css";
import helloworld_program from "../helloworld/build/main.aleo?raw";
import { AleoWorker } from "./workers/AleoWorker.js";

const aleoWorker = AleoWorker();
function App() {
  const [count, setCount] = useState(0);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateAccount = async () => {
    const key = await aleoWorker.getPrivateKey()
    console.log(key)
    //setAccount(await key.to_string());
  };

  async function execute() {
    setLoading(true)
    const result = await aleoWorker.localProgramExecution(helloworld_program)
    // const result = await postMessagePromise(worker, {
    //   type: "ALEO_EXECUTE_PROGRAM_LOCAL",
    //   localProgram: helloworld_program,
    //   aleoFunction: "main",
    //   inputs: ["5u32", "5u32"],
    //   privateKey: account.to_string(),
    // });
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
          <button onClick={generateAccount}>
            {account
              ? `Account is ${JSON.stringify(account)}`
              : `Click to generate account`}
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
