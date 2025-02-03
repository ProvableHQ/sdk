// main.js

import "./style.css";

// Use Vite's new URL syntax to properly resolve the worker
const worker = new Worker(new URL("./worker.js", import.meta.url), {
  type: "module",
});

// Set to keep track of minted ducks
const mintedDucks = new Set();

// Handle messages from the worker
worker.onmessage = async function (e) {
  console.log(e.data);
  alert(e.data);

  // Extract the duck_id and transaction ID from the message using regex
  const message = e.data;
  
  // Regex to match: "Minted duck with duck_id=3field. Transaction ID: at1rfmpx8hnwgv4kregcsyvmj9jq95l6mfyjn854gqsrjayls6xyurs4f2404"
  const mintMatch = message.match(/Minted duck with duck_id=(\d+)field\. Transaction ID:\s*([a-z0-9]+)/i);
  
  if (mintMatch) {
    const duckId = `${mintMatch[1]}field`;
    const txId = mintMatch[2]; // Extracted transaction ID

    // Check if already minted
    if (mintedDucks.has(duckId)) {
      alert(`Duck ${duckId} has already been minted.`);
      return;
    }

    mintedDucks.add(duckId);

    // Fetch the metadata.json locally from the public directory
    try {
      const response = await fetch("/metadata.json");
      if (!response.ok) {
        throw new Error("Failed to fetch metadata.");
      }
      const metadata = await response.json();

      // Get the image URL for the minted duck_id
      const duckImageUrl = metadata[duckId];

      // Set the duck image
      const img = document.getElementById("duckImage");
      if (img && duckImageUrl) {
        img.src = duckImageUrl;
        img.alt = `Emo Duck ${duckId}`;
      } else {
        console.error(`No image found for duck_id=${duckId}`);
      }

      // Display the transaction ID below the image
      const txElement = document.getElementById("transactionId");
      if (txElement) {
        txElement.innerText = `Success! Your transaction ID is ${txId}`;
        txElement.style.display = "block"; // Ensure the message is visible
      }
    } catch (error) {
      console.error("Error fetching metadata:", error);
      alert("Failed to load duck image.");
    }
  } else if (message.includes("Error executing mint_duck on-chain")) {
    // Handle errors gracefully
    alert("Failed to mint duck. It might already be minted. Try again!");
  }
};

// Function to generate a random duck_id and send it to the worker
const totalDucks = 21;

window.executeRandom = () => {
  // Generate a random integer between 0 and 20
  const randomNumber = Math.floor(Math.random() * totalDucks);
  const duckId = `${randomNumber}field`;
  worker.postMessage({ action: "execute", duckId });
};

// Render the HTML structure with a placeholder image and transaction ID message
document.querySelector("#app").innerHTML = `
  <div style="display:flex; flex-direction:column; align-items:center;">
    <h1>Emo Ducks NFT</h1>
    <p>duck you bro like fr duck you xD</p>
    <div class="card" style="padding:20px; text-align:center;">
      <button onclick="window.executeRandom()">Mint a Random Duck</button>
    </div>
    <div style="margin-top:20px;">
      <img id="duckImage" 
           src="/assets/placeholder.jpeg" 
           alt="Your minted duck will appear here" 
           style="max-width:300px; border: 2px solid #ccc; border-radius:10px;"/>
    </div>
    <p id="transactionId" class="transaction-id" style="margin-top:10px; display: none;"></p>
  </div>
`;
