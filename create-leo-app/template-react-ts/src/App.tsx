import { useState } from "react";
import reactLogo from "./assets/react.svg";
import aleoLogo from "./assets/aleo.svg";
import "./App.css";
import helloworld_program from "../helloworld/build/main.aleo?raw";
import { AleoWorker } from "./workers/AleoWorker";

// Sample SNARK proof fixtures from a simple test circuit with 2 public inputs, both equal to 1field.
const SAMPLE_VERIFYING_KEY = "verifier1qypqqqqqqqqqqqyxqqqqqqqqqqqyzqqqqqqqqqqqgyqqqqqqqqqqqsgqqqqqqqqqqpqsqqqqqqqqqqqvqqqqqqqqqqqgh4c0dzjasutflzxx36ckaea0zr5xqu0ydpaascrhacjlftlvnt99yg003w45g0mj4qepazsl5w5qfl5dm9y3sfq87376ynfyync09xyaz05ggfh79lkpx6yzunrz06zdwsu4klsj9z3933wpeggqj2msqs5xeul99lvzyd98mfmqm34nud4z7qjkxk708d9mvgqqw9hwkes726yl5nla6mr7s56p2a2c36csqpl0qe39wd8rswunurla70pqes7fay5kzh7jv5l5plpc82yu5p8thnxavejw3kwxz038sdmf34n9uqt77pnz2u6w8qae8c8lmu7zpnpun6ffv90ayeflgr7rsw5fegzwh0xd6enyarvuvylz0qmknrtxtcqhaurxy4e5uwpmj0s0lheuyrxre85jjc2l6fjn7s8u8qagnjsyaw7vm4nxf6xeccf7y7phdxxkvhspj4chhza3rsj4v66lfc00u27y9g2mlg7ttgdx8m9d09lns7lcjqmcs9lraqk9wac52hwc0th9g3qsrrsk2xszjn0qyuwcas5g76c4l8u8zycc5n4uslf6kajp0c4aq6ea7d8u3rvxkql5l8njthv82ygpsqmd034693yathl585th5rh29c0yf29l7yk4nry7daf3ndm7lhv8nvy546sa0uysqcvdy5tlxzqq3q8swlatmy33h6zn7ychqcnjjvfc8a4q0szr70k9l2qa8my76c0ud5e5t5yksd78ytlhey426p2xdxq2vfrtuhduyjjh5wgwn35fxz2rvhgaysyhgph4at920ykfrjqph8gjp47vl77zlzqhnwljkxnz6guqmh8xy62966f0sw505l07m64r2qvxd9ggzng7naawtsran2yj77fts7e7mccf25svwdhzt998ee7cruwc6gx9krqpj4ll7x5jw0l3sw8kwjfgck0an2dwcp4dz9yfq272svqqqqqqqqqqqhzxq3v";
const SAMPLE_PROOF = "proof1qyqsqqqqqqqqqqqpqqqqqqqqqqqg4v4ffaewfrdfyl442hd2jryku27u9cajphqaqa5keztfzy75mxctwth0w9599r2ra0awu9jfmj5qq9n6ufwrq0r68g2wcse7avhuy2t37mp35s39wtl0z9f53qhatkl4gqpyzheggtkj2gxzl45jwjtx8qtsx5wh09f286p866gzc6x292u773zhtgzvxucw5jv397ngkh5wcwtjzwy8qsxhtywz5egx5hzg6wqyayt8ernlmgdy7d6ytmxyx3azdvy6qsjfcqjdmvr3ycaqmzaz20umm3zu4jzunjkwfsm3ry9nu7vqfypg567n33m3226l797v7pqltuw8yl8xwh5jrkgpgjvl8uqp2fttyvs7k0ye5eeeswnl0506aw0qrnxpc687002ukjxdd222ffw6lk8gleuf0tvq4lxkskmhrlqaj95zvp2w9aeza4sdt7hdecy29er3s84skdxq5uf0m767ecpa60tm0krx4vdp2umvdy6aaddy7xxpvtwmwfan8z23yud27z8pan8msgr3zq2s2qnfnqhg8cltzl7v9fewna69kavvy570l62k55x2wayjvvhha2uk6vje5zsgvqw67cskce4dxcqtrdpvkkl3n7yt2v4pwexhw8ftgnv0kkvumgha2cfyn84yp7v2ztysawmt65y2z28auutxlh05nvcqlhaj2a3wd3gqw6tc02z0s67v4x5kh3st28v30nf9cv9k6g5jnc89z4hmu32nnnm9j625q75nfcr99hjpqu50rhqpu57lqnjdwhfu2pvstze2c0qj0a2d4zkcg88ep79eyqe7e399hx86e6p4qswjk32dpg45r7jtzhse8szcaxu7md99u7luj2afl07jzp5zqut05a85qg5qkd8syclvv5sqf4xtfqca4c9r6ffptmv2l587qx8knn7qpukt4hqqpkw27z7tf0xk9z7esermt8hmr2auefw3c0drel890ep6rujt3uff504q744z5s9v2krxkvh3vqjjr48dnuzx5vzpymcz0sdvvt7v7p5pymj82a5p33fd4xup79muz3zvn8tq09mlfujr2nyv99ad80u4qvutsca8g63aw7dsq0hvql3c07l0lxl39lwr8gqwqpvfx85tjpyq3wgn3c7az3xvnj22h2c4qq356zgxjwl69wn4jx4srjsczanm9sqdqvqqqqqqqqqqq2ku9a56rnzvm4zchvwea5dt9qnwjl789zar0dvjmze3aft5d567q2ntdw85p6ep925xx3hymjgwqyqtnxjhxr50cp8tqvpwlexzyajld9z2gu3zzy6cvllnh2kmzr4ctdz78wyprdvxyf2aqs8apz866aspq9qdtd535z8uqaacz6d9v7jahs87gav0388kg0ctdup7h93pphqs27m5jud96f2pnwclyhvk3lv9pgl57l7mqzgljm9qc2kdy39j8eyhq8guca5ytphd7cnjl9u8nurcqqqqw7lyxe";
const SAMPLE_INPUTS = "1field, 1field";

const aleoWorker = AleoWorker();
function App() {
  const [count, setCount] = useState(0);
  const [account, setAccount] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyingKeyInput, setVerifyingKeyInput] = useState(SAMPLE_VERIFYING_KEY);
  const [proofInput, setProofInput] = useState(SAMPLE_PROOF);
  const [inputsInput, setInputsInput] = useState(SAMPLE_INPUTS);

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

  async function verifyProof() {
    setVerifying(true);
    try {
      // Split on commas, but respect brace-delimited structs (e.g. "{ x: 1u8, y: 2u8 }")
      const inputs: string[] = [];
      let depth = 0;
      let current = "";
      for (const ch of inputsInput) {
        if (ch === "{") depth++;
        else if (ch === "}") depth--;
        if (ch === "," && depth === 0) {
          if (current.trim()) inputs.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
      if (current.trim()) inputs.push(current.trim());
      const result = await aleoWorker.verifyProof(verifyingKeyInput, proofInput, inputs);
      alert(`Proof verification result: ${result}`);
    } catch (e) {
      console.log(e);
      alert("Error with proof verification, please check console for details");
    }
    setVerifying(false);
  }

  async function deploy() {
    setDeploying(true);
    try {
      const result = await aleoWorker.deployProgram(helloworld_program);
      console.log("Transaction:")
      console.log("https://explorer.provable.com/transaction/" + result)
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
        <a href="https://provable.com" target="_blank">
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
              ? `Account private key is ${JSON.stringify(account)}`
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
          <label>Verifying Key</label>
          <textarea
            placeholder="Verifying Key (verifier1...)"
            value={verifyingKeyInput}
            onChange={(e) => setVerifyingKeyInput(e.target.value)}
            rows={3}
            style={{ width: "100%", fontFamily: "monospace", fontSize: "0.8em" }}
          />
        </p>
        <p>
          <label>Proof</label>
          <textarea
            placeholder="Proof (proof1...)"
            value={proofInput}
            onChange={(e) => setProofInput(e.target.value)}
            rows={3}
            style={{ width: "100%", fontFamily: "monospace", fontSize: "0.8em" }}
          />
        </p>
        <p>
          <label>Public Inputs (comma-separated)</label>
          <input
            placeholder="e.g. 1field, 2field"
            value={inputsInput}
            onChange={(e) => setInputsInput(e.target.value)}
            style={{ width: "100%", fontFamily: "monospace", fontSize: "0.8em" }}
          />
        </p>
        <p>
          <button disabled={verifying} onClick={verifyProof}>
            {verifying
              ? `Verifying proof...`
              : `Verify SNARK proof`}
          </button>
        </p>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
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
