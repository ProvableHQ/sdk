import { useState } from "react";
import reactLogo from "./assets/react.svg";
import aleoLogo from "./assets/aleo.png";
import "./App.css";
import { createAleoWorker } from "@aleohq/sdk";

const aleoWorker = createAleoWorker();

function App() {
  const [count, setCount] = useState(0);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateAccount = async () => {
    const privateKey = await aleoWorker.getPrivateKey();
    setAccount(privateKey);
  };

  async function execute() {
    const hello_hello_program =
        "program hello_hello.aleo;\n" +
        "\n" +
        "function hello:\n" +
        "    input r0 as u32.public;\n" +
        "    input r1 as u32.private;\n" +
        "    add r0 r1 into r2;\n" +
        "    output r2 as u32.private;\n";

    setLoading(true);
    const result = await aleoWorker.run(hello_hello_program,"hello", ["5u32", "5u32"], "APrivateKey1zkp778oUFSck3PZA5xppgp4trFwkkD6xnUXtxcBCfsq4URJ")
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
              {
                  (account
                      ? `Account is ${JSON.stringify(account)}`
                      : `Click to generate account`)
              }
            </button>
          </p>
          <p>
            <button disabled={!account || loading} onClick={execute}>
              {loading
                  ? `Executing...check console for details...`
                  : `Execute hello_hello.aleo`}
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
