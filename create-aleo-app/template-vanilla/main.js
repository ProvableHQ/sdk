import "./style.css";
import javascriptLogo from "./javascript.svg";
import aleoLogo from "/aleo.svg";
import viteLogo from "/vite.svg";

const worker = new Worker("worker.js", {
    type: "module",
});

worker.onmessage = function (e) {
    console.log(e.data);
    alert(e.data);
};

window.execute = () => {
    worker.postMessage("execute");
};

window.key = () => {
    worker.postMessage("key");
};

document.querySelector("#app").innerHTML = `
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://aleo.org/" target="_blank">
      <img src="${aleoLogo}" class="logo" alt="Aleo logo" />
    </a>
    <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
      <img src="${javascriptLogo}" class="logo vanilla" alt="JavaScript logo" />
    </a>
    <h1>Hello Aleo!</h1>
    <div class="card">
      <button onclick="window.execute()">Call Execute Function</button>
      <button onclick="window.key()">Get Private Key</button>
    </div>
    <p class="read-the-docs">
      Click on the Aleo logo to learn more
    </p>
  </div>
`;
