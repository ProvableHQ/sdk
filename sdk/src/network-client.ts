import axios from "axios";
import {Account, Block, RecordCiphertext, Program, RecordPlaintext, PrivateKey, WasmTransaction, Transaction, Transition} from ".";

type ProgramImports = { [key: string]: string | Program };

/**
 * Client library that encapsulates REST calls to publicly exposed endpoints of Aleo nodes. The methods provided in this
 * allow users to query public information from the Aleo blockchain and submit transactions to the network.
 *
 * @param {string} host
 * @example
 * // Connection to a local node
 * const localNetworkClient = new AleoNetworkClient("http://localhost:3030");
 *
 * // Connection to a public beacon node
 * const publicnetworkClient = new AleoNetworkClient("https://vm.aleo.org/api");
 */
class AleoNetworkClient {
  host: string;
  account: Account | undefined;

  constructor(host: string) {
    this.host = host + "/testnet3";
  }

  /**
   * Set an account
   *
   * @param {Account} account
   * @example
   * const account = new Account();
   * networkClient.setAccount(account);
   */
  setAccount(account: Account) {
    this.account = account;
  }

  /**
   * Return the Aleo account used in the networkClient
   *
   * @example
   * const account = networkClient.getAccount();
   */
  getAccount(): Account | undefined {
    return this.account;
  }

  async fetchData<Type>(
      url = "/",
  ): Promise<Type> {
    try {
      const response = await axios.get<Type>(this.host + url);
      return response.data;
    } catch (error) {
      throw new Error("Error fetching data.");
    }
  }

  /**
   * Attempts to find unspent records in the Aleo blockchain for a specified private key
   *
   * @example
   * // Find all unspent records
   * const privateKey = "[PRIVATE_KEY]";
   * const records = networkClient.findUnspentRecords(0, undefined, privateKey);
   *
   * // Find specific amounts
   * const startHeight = 500000;
   * const amounts = [600000, 1000000];
   * const records = networkClient.findUnspentRecords(startHeight, undefined, privateKey, amounts);
   *
   * // Find specific amounts with a maximum number of cumulative microcredits
   * const maxMicrocredits = 100000;
   * const records = networkClient.findUnspentRecords(startHeight, undefined, privateKey, undefined, maxMicrocredits);
   */
  async findUnspentRecords(
      startHeight: number,
      endHeight: number | undefined,
      privateKey: string | PrivateKey | undefined,
      amounts: number[] | undefined,
      maxMicrocredits?: number | undefined,
      nonces?: string[] | undefined,
  ): Promise<Array<RecordPlaintext> | Error> {
    nonces = nonces || [];
    // Ensure start height is not negative
    if (startHeight < 0) {
      throw new Error("Start height must be greater than or equal to 0");
    }

    // Initialize search parameters
    const records = new Array<RecordPlaintext>();
    let start;
    let end;
    let resolvedPrivateKey: PrivateKey;
    let failures = 0;
    let totalRecordValue = BigInt(0);
    let latestHeight: number;

    // Ensure a private key is present to find owned records
    if (typeof privateKey === "undefined") {
      if (typeof this.account === "undefined") {
        throw new Error("Private key must be specified in an argument to findOwnedRecords or set in the AleoNetworkClient");
      } else {
        resolvedPrivateKey = this.account._privateKey;
      }
    } else {
      try {
        resolvedPrivateKey = privateKey instanceof PrivateKey ? privateKey : PrivateKey.from_string(privateKey);
      } catch (error) {
        throw new Error("Error parsing private key provided.");
      }
    }
    const viewKey = resolvedPrivateKey.to_view_key();

    // Get the latest height to ensure the range being searched is valid
    try {
      const blockHeight = await this.getLatestHeight();
      if (typeof blockHeight === "number") {
        latestHeight = blockHeight;
      } else {
        throw new Error("Error fetching latest block height.");
      }
    } catch (error) {
      throw new Error("Error fetching latest block height.");
    }

    // If no end height is specified or is greater than the latest height, set the end height to the latest height
    if (typeof endHeight === "number" && endHeight <= latestHeight) {
      end = endHeight
    } else {
      end = latestHeight;
    }

    // If the starting is greater than the ending height, return an error
    if (startHeight > end) {
      throw new Error("Start height must be less than or equal to end height.");
    }

    // Iterate through blocks in reverse order in chunks of 50
    while (end > startHeight) {
      start = end - 50;
      if (start < startHeight) {
        start = startHeight;
      }
      try {
        // Get 50 blocks (or the difference between the start and end if less than 50)
        const blocks = await this.getBlockRange(start, end);
        end = start;
        if (!(blocks instanceof Error)) {
          // Iterate through blocks to find unspent records
          for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            const transactions = block.transactions;
            if (!(typeof transactions === "undefined")) {
              for (let j = 0; j < transactions.length; j++) {
                const confirmedTransaction = transactions[j];
                // Search for unspent records in execute transactions of credits.aleo
                if (confirmedTransaction.type == "execute") {
                  const transaction = confirmedTransaction.transaction;
                  if (transaction.execution && !(typeof transaction.execution.transitions == "undefined")) {
                    for (let k = 0; k < transaction.execution.transitions.length; k++) {
                      const transition = transaction.execution.transitions[k];
                      // Only search for unspent records in credits.aleo (for now)
                      if (transition.program !== "credits.aleo") {
                        continue;
                      }
                      if (!(typeof transition.outputs == "undefined")) {
                        for (let l = 0; l < transition.outputs.length; l++) {
                          const output = transition.outputs[l];
                          if (output.type === "record") {
                            try {
                              // Create a wasm record ciphertext object from the found output
                              const record = RecordCiphertext.fromString(output.value);
                              // Determine if the record is owned by the specified view key
                              if (record.isOwner(viewKey)) {
                                // Decrypt the record and get the serial number
                                const recordPlaintext = record.decrypt(viewKey);

                                // If the record has already been found, skip it
                                const nonce = recordPlaintext.nonce();
                                if (nonces.includes(nonce)) {
                                  continue;
                                }

                                // Otherwise record the nonce that has been found
                                nonces.push(nonce);
                                const serialNumber = recordPlaintext.serialNumberString(resolvedPrivateKey, "credits.aleo", "credits");
                                // Attempt to see if the serial number is spent
                                try {
                                  await this.getTransitionId(serialNumber);
                                } catch (error) {
                                  // If it's not found, add it to the list of unspent records
                                  records.push(recordPlaintext);
                                  // If the user specified a maximum number of microcredits, check if the search has found enough
                                  if (typeof maxMicrocredits === "number") {
                                    totalRecordValue = recordPlaintext.microcredits();
                                    // Exit if the search has found the amount specified
                                    if (totalRecordValue >= BigInt(maxMicrocredits)) {
                                      return records;
                                    }
                                  }
                                  // If the user specified a list of amounts, check if the search has found them
                                  if (!(typeof amounts == "undefined")) {
                                    let amounts_found = 0;
                                    for (let m = 0; m < amounts.length; m++) {
                                      for (let n = 0; m < records.length; n++) {
                                        if (records[n].microcredits() >= BigInt(amounts[m])) {
                                          amounts_found++;
                                          // Exit if the search has found the amounts specified
                                          if (amounts_found >= amounts.length) {
                                            return records;
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            } catch (error) {
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        // If there is an error fetching blocks, log it and keep searching
        console.log("Error fetching blocks in range: " + start.toString() + "-" + end.toString());
        console.log("Error: ", error);
        failures += 1;
        if (failures > 10) {
          console.log("10 failures fetching records reached. Returning records fetched so far");
          return records;
        }
      }
    }
    return records;
  }

  /**
   * Returns the block contents of the block at the specified block height
   *
   * @param {number} height
   * @example
   * const block = networkClient.getBlock(1234);
   */
  async getBlock(height: number): Promise<Block | Error> {
    try {
      const block = await this.fetchData<Block>("/block/" + height);
      return block;
    } catch (error) {
      throw new Error("Error fetching block.");
    }
  }

  /**
   * Returns a range of blocks between the specified block heights
   *
   * @param {number} start
   * @param {number} end
   * @example
   * const blockRange = networkClient.getBlockRange(2050, 2100);
   */
  async getBlockRange(start: number, end: number): Promise<Array<Block> | Error> {
    try {
      return await this.fetchData<Array<Block>>("/blocks?start=" + start + "&end=" + end);
    } catch (error) {
      const errorMessage = "Error fetching blocks between " + start + " and " + end + "."
      throw new Error(errorMessage);
    }
  }

  /**
   * Returns the block contents of the latest block
   *
   * @example
   * const latestHeight = networkClient.getLatestBlock();
   */
  async getLatestBlock(): Promise<Block | Error> {
    try {
      return await this.fetchData<Block>("/latest/block") as Block;
    } catch (error) {
      throw new Error("Error fetching latest block.");
    }
  }

  /**
   * Returns the hash of the last published block
   *
   * @example
   * const latestHash = networkClient.getLatestHash();
   */
  async getLatestHash(): Promise<string | Error> {
    try {
      return await this.fetchData<string>("/latest/hash");
    } catch (error) {
      throw new Error("Error fetching latest hash.");
    }
  }

  /**
   * Returns the latest block height
   *
   * @example
   * const latestHeight = networkClient.getLatestHeight();
   */
  async getLatestHeight(): Promise<number | Error> {
    try {
      return await this.fetchData<number>("/latest/height");
    } catch (error) {
      throw new Error("Error fetching latest height.");
    }
  }

  /**
   * Returns the source code of a program
   *
   * @param {string} programId The program ID of a program deployed to the Aleo Network
   * @return {Promise<string>} Source code of the program
   *
   * @example
   * const program = networkClient.getProgram("hello_hello.aleo");
   * const expectedSource = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n"
   * assert.equal(program, expectedSource);
   */
  async getProgram(programId: string): Promise<string | Error> {
    try {
      return await this.fetchData<string>("/program/" + programId)
    } catch (error) {
      throw new Error("Error fetching program");
    }
  }

  /**
   *  Returns an object containing the source code of a program and the source code of all programs it imports
   *
   * @param programName
   * @returns {Promise<ProgramImports>} Source code of the program and all programs it imports
   *
   * @example
   * const programImports = networkClient.getProgramImports("double_test.aleo");
   * const expectedImports = {
   *     "multiply_test.aleo": "program multiply_test.aleo;\n\nfunction multiply:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    mul r0 r1 into r2;\n    output r2 as u32.private;\n"
   * }
   * assert.deepStrictEqual(programImports, expectedImports);
   */
  async getProgramImports(programName: string): Promise<ProgramImports> {
    try {
      // Get the program source code from the network
      const imports: { [key: string]: any } = {};
      const program = await this.getProgram(programName);

      // Get the list of programs that the program imports
      const importList = Program.fromString(<string>program).getImports();

      // Recursively get any imports that the imported programs have in a depth first search order
      for (let i = 0; i < importList.length; i++) {
        const import_id = importList[i];
        if (!imports.hasOwnProperty(import_id)) {
          const programSource = await this.getProgram(import_id);
          const nestedImports = await this.getProgramImports(import_id);
          for (const key in nestedImports) {
            if (!imports.hasOwnProperty(key)) {
              imports[key] = nestedImports[key];
            }
          }
          imports[import_id] = programSource;
        }
      }
      return imports;
    } catch (error) {
      console.error("Error fetching program imports: " + error);
      throw new Error("Error fetching program imports" + error);
    }
  }

  /**
   * Get a list of the program names that a program imports
   *
   * @param program [Program | string] - The program or program source code to get the imports of
   * @returns {string[]} - The list of program names that the program imports
   *
   * @example
   * const programImportsNames = networkClient.getProgramImports("double_test.aleo");
   * const expectedImportsNames = ["multiply_test.aleo"];
   * assert.deepStrictEqual(programImportsNames, expectedImportsNames);
   */
  async getProgramImportNames(program_name: string): Promise<string[] | Error> {
    try {
      const program = await this.getProgram(program_name);
      return Program.fromString(<string>program).getImports();
    } catch (error) {
      throw new Error("Error fetching program imports with error: " + error);
    }
  }

  /**
   * Returns the names of the mappings of a program
   *
   * @param {string} programId
   * @example
   * const mappings = networkClient.getProgramMappingNames("credits.aleo");
   * const expectedMappings = ["account"];
   * assert.deepStrictEqual(mappings, expectedMappings);
   */
  async getProgramMappingNames(programId: string): Promise<Array<string> | Error> {
    try {
      return await this.fetchData<Array<string>>("/program/" + programId + "/mappings")
    } catch (error) {
      throw new Error("Error fetching program mappings - ensure the program exists on chain before trying again");
    }
  }

  /**
   * Returns the value of a program's mapping for a specific key
   *
   * @param {string} programId
   * @param {string} mappingName
   * @param {string} key
   * @return {Promise<string>} String representation of the value of the mapping
   *
   * @example
   * // Get public balance of an account
   * const mappingValue = networkClient.getMappingValue("credits.aleo", "account", "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px");
   * const expectedValue = "0u64";
   * assert.equal(mappingValue, expectedValue);
   */
  async getProgramMappingValue(programId: string, mappingName: string, key: string): Promise<string | Error> {
    try {
      return await this.fetchData<string>("/program/" + programId + "/mapping/" + mappingName + "/" + key)
    } catch (error) {
      throw new Error("Error fetching mapping value - ensure the mapping exists and the key is correct");
    }
  }

  /**
   * Returns the latest state/merkle root of the Aleo blockchain
   *
   * @example
   * const stateRoot = networkClient.getStateRoot();
   */
  async getStateRoot(): Promise<string | Error> {
    try {
      return await this.fetchData<string>("/latest/stateRoot");
    } catch (error) {
      throw new Error("Error fetching Aleo state root");
    }
  }

  /**
   * Returns a transaction by its unique identifier
   *
   * @param {string} id
   * @example
   * const transaction = networkClient.getTransaction("at1handz9xjrqeynjrr0xay4pcsgtnczdksz3e584vfsgaz0dh0lyxq43a4wj");
   */
  async getTransaction(id: string): Promise<Transaction | Error> {
    try {
      return await this.fetchData<Transaction>("/transaction/" + id);
    } catch (error) {
      throw new Error("Error fetching transaction.");
    }
  }

  /**
   * Returns the transactions present at the specified block height
   *
   * @param {number} height
   * @example
   * const transactions = networkClient.getTransactions(654);
   */
  async getTransactions(height: number): Promise<Array<Transaction> | Error> {
    try {
      return await this.fetchData<Array<Transaction>>("/block/" + height.toString() + "/transactions");
    } catch (error) {
      throw new Error("Error fetching transactions.");
    }
  }

  /**
   * Returns the transactions in the memory pool.
   *
   * @example
   * const transactions = networkClient.getTransactionsInMempool();
   */
  async getTransactionsInMempool(): Promise<Array<Transaction> | Error> {
    try {
      return await this.fetchData<Array<Transaction>>("/memoryPool/transactions");
    } catch (error) {
      throw new Error("Error fetching transactions from mempool.");
    }
  }

  /**
   * Returns the transition id by its unique identifier
   *
   * @example
   * const transition = networkClient.getTransitionId("2429232855236830926144356377868449890830704336664550203176918782554219952323field");
   */
  async getTransitionId(transition_id: string): Promise<Transition | Error> {
    try {
      return await this.fetchData<Transition>("/find/transitionID/" + transition_id);
    } catch (error) {
      throw new Error("Error fetching transition ID.");
    }
  }

  /**
   * Submit an execute or deployment transaction to the Aleo network
   *
   * @param transaction [wasmTransaction | string] - The transaction to submit to the network
   * @returns {string | Error} - The transaction id of the submitted transaction or the resulting error
   */
  async submitTransaction(transaction: WasmTransaction | string): Promise<string | Error> {
    const transaction_string = transaction instanceof WasmTransaction ? transaction.toString() : transaction;
    try {
      const response = await axios
          .post<string>(
              this.host + "/testnet3/transaction/broadcast",
              transaction_string,
              {
                headers: {
                  "Content-Type": "application/json",
                },
              },
          )
      return response.data;
    } catch (error) {
      throw new Error(`Error posting transaction: ${error}`);
    }
  }
}

export { AleoNetworkClient, ProgramImports }