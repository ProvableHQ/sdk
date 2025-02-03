import {
  Account,
  ProgramManager,
  initThreadPool,
  AleoKeyProvider,
  AleoNetworkClient,
  NetworkRecordProvider,
} from "@provablehq/sdk";

// Initialize thread pool for Aleo SDK
await initThreadPool();

const PROGRAM_ID = "emo_ducks.aleo"; 
console.log("Program ID:", PROGRAM_ID);

const privateKey = import.meta.env.VITE_PRIVATE_KEY;

/**
 * Executes a transition on the Aleo testnet.
 * @param {string} programId - The deployed program ID.
 * @param {string} aleoFunction - The transition/function name to execute.
 * @param {Array<string>} inputs - The inputs required by the transition.
 * @returns {Object} - The response from the network after execution.
 */

async function executeOnChain(programId, aleoFunction, inputs) {
  const keyProvider = new AleoKeyProvider();
  keyProvider.useCache(true);

  // Connect to the Aleo testnet
  const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
  let program = await networkClient.getProgram("emo_ducks.aleo");
  console.log(program);


  // Load your existing account using the private key from environment variables
  const account = new Account({ privateKey: privateKey });
  console.log("Account Loaded:", account.address);



  const recordProvider = new NetworkRecordProvider(account, networkClient);

  // Initialize the ProgramManager with network and record providers
  const programManager = new ProgramManager(
    "https://api.explorer.provable.com/v1",
    keyProvider,
    recordProvider,
  );
  programManager.setAccount(account);
  console.log("ProgramManager Initialized.");

  // Define a transaction fee (in Aleo credits)
  const fee = 0.5; // Adjust based on network requirements
  console.log("Transaction Fee:", fee);

  try {
    console.log(`Executing function '${aleoFunction}' on program '${programId}' with inputs:`, inputs);
    // Execute the transition on-chain
    const response = await programManager.execute(programId, aleoFunction, inputs, fee);
    console.log("Execution Response:", response);
    return response;
  } catch (error) {
    console.error("Execution Error:", error);
    throw new Error(`Execution failed: ${error.message}`);
  }
}


/**
 * Handles incoming messages from the main thread.
 */
onmessage = async function (e) {
  console.log("message happening");
  console.log("Private Key:", privateKey);
  const data = e.data;


  if (data.action === "execute") {
    console.log("execute happening");
    const duckId = data.duckId;
    console.log("Duck ID:", duckId);

    try {
      const params = {
          programName: PROGRAM_ID,
          functionName: "mint_duck",
          fee: 2.0,
          inputs: [duckId],
          keySearchParams: {},
          additionalOptions: {},
      };

      // Format the duckId as a string without additional quotes
      const formattedDuckId = duckId;
      console.log("Formatted Duck ID:", formattedDuckId);

      console.log(PROGRAM_ID);
      // const result = await executeOnChain(PROGRAM_ID, "mint_duck", [formattedDuckId]);
      const result = await executeOnChain(params);

      // Assuming the response contains details about the transaction
      console.log("Minting Successful:", result);
      postMessage(`Minted duck with duck_id=${duckId}. Transaction ID: ${result}`);
  } catch (error) {
      console.error("Error executing mint_duck on-chain:", error);
      postMessage(`Error executing mint_duck on-chain: ${error.message}`);
    }
  }
};
