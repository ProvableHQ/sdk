import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import aleoLogo from "./assets/aleo.svg";
import "./App.css";
import helloworld_program from "../helloworld/build/main.aleo?raw";
import auction_program from "../auction/build/main.aleo?raw";
import { AleoWorker } from "./workers/AleoWorker.js";

const aleoWorker = AleoWorker();

function SimpleTable({ data }) {
  return (
      <table>
          <thead>
              <tr>
                  <th>Address</th>
                  <th>Amount</th>
                  <th>Record</th>
              </tr>
          </thead>
          <tbody>
              {data.length > 0 ? (
                  data.map((row, index) => (
                      <tr key={index}>
                          <td>{row.address}</td>
                          <td>{row.amount}</td>
                          <td>{row.record}</td>
                      </tr>
                  ))
              ) : (
                  <tr>
                      <td colSpan="3">Waiting for data...</td>
                  </tr>
              )}
          </tbody>
      </table>
  );
}

function App() {
  const [count, setCount] = useState(0);
  const [account, setAccount] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [deploying, setDeploying] = useState(false);

  const [tableData, setTableData] = useState([]);
  const [bidding, setBidding] = useState(false);

  const generateAccount = async () => {
    const key = await aleoWorker.getPrivateKey();
    setAccount(await key.to_string());
  };

  async function execute() {
    setExecuting(true);
    const result = await aleoWorker.localProgramExecution(
      helloworld_program,
      "main",
      ["5u32", "5u32"],
    );
    setExecuting(false);

    alert(JSON.stringify(result));
  }

  const place_bid = async () => {
    if (bidding) return;

    const address = window.prompt('Please enter your address:');
    const amount = window.prompt('Please enter your bid amount:');
  
    if (!address || !amount) return;

    setBidding(true);

    try {
      // calculate the result
      const result = await aleoWorker.localProgramExecution(
        auction_program,
        "place_bid",
        [address, amount]
      );
      const recordRes = JSON.stringify(result).replace(/\\n/g, '\n');
      const cleanedRec = recordRes
        .replace(/\.private|\.public|\.group/g, '')
        .replace(/(\w+):/g, '"$1":')
        .replace(/(\w+\d+):/g, '"$1":')
        .replace(/: (\w+),/g, ': "$1",')
        .replace(/: (\w+)\}/g, ': "$1"}');
        // .replace(/: (\d+)group/g, ': "$1"');
      console.log(cleanedRec);

      const newData = {
        address: address,
        amount: amount,
        record: cleanedRec
      }

      // append to data table
      setTableData(prevData => [...prevData, newData]);

      // visual log of what happens
      console.log('Address placing bid:', address);
      console.log('Bid placed with amount:', amount);
      console.log(newData);
      alert(newData);

    } catch (error) {
      console.error("Error placing bid:", error);
    }
    setBidding(false);
  };

  async function deploy() {
    setDeploying(true);
    try {
      const result = await aleoWorker.deployProgram(helloworld_program);
      console.log("Transaction:")
      console.log("https://explorer.hamp.app/transaction?id=" + result)
      alert("Transaction ID: " + result);
    } catch (e) {
      console.log(e)
      alert("Error with deployment, please check console for details");
    }
    setDeploying(false);
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
          <button disabled={executing} onClick={execute}>
            {executing
              ? `Executing...check console for details...`
              : `Execute helloworld.aleo`}
          </button>
        </p>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <div className="auction">
      <h2>Auction Actions</h2>
      <p>
        <button disabled={executing} onClick={place_bid}>
          {executing ? 'placing a bid...' : 'place a bid'}
        </button>
      </p>
      </div>
      <div>
          <h2>Auction Table</h2>
          <SimpleTable data={tableData} />
      </div>

      {/* Advanced Section */}
      <div className="card">
        <h2>Advanced Actions</h2>
        <p>
          Deployment on Aleo requires certain prerequisites like seeding your
          wallet with credits and retrieving a fee record. Check README for more
          details.
        </p>
        <p>
          <button disabled={deploying} onClick={deploy}>
            {deploying
              ? `Deploying...check console for details...`
              : `Deploy helloworld.aleo`}
          </button>
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Aleo and React logos to learn more
      </p>
    </>
  );
}

export default App;
