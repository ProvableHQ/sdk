import axios from "axios";
import { Account, Block, Transaction, Transition } from ".";
import { RecordCiphertext, RecordPlaintext, PrivateKey } from "@aleohq/nodejs";

/**
 * Connection management class that encapsulates REST calls to publicly exposed endpoints of Aleo nodes.
 * The methods provided in this class provide information on the Aleo Blockchain
 *
 * @param {string} host
 * @example
 * // Connection to a local node
 * let local_connection = new AleoNetworkClient("http://localhost:3030");
 *
 * // Connection to a public beacon node
 * let public_connection = new AleoNetworkClient("https://vm.aleo.org/api");
 */
export class AleoNetworkClient {
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
   * let account = new Account();
   * connection.setAccount(account);
   */
  setAccount(account: Account) {
    this.account = account;
  }

  /**
   * Return the Aleo account used in the node connection
   *
   * @example
   * let account = connection.getAccount();
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
   * Returns the block contents of the block at the specified block height
   *
   * @param {number} height
   * @example
   * let block = connection.getBlock(1234);
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
   * let blockRange = connection.getBlockRange(2050, 2100);
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
   * Returns the source code of a program
   *
   * @param {string} programId
   * @example
   * let program = connection.getProgram("foo.aleo");
   */
  async getProgram(programId: string): Promise<string | Error> {
    try {
      return await this.fetchData<string>("/program/" + programId)
    } catch (error) {
      throw new Error("Error fetching program");
    }
  }

  /**
   * Returns the names of the mappings of a program
   *
   * @param {string} programId
   * @example
   * let mappings = connection.getProgramMappingNames("credits.aleo");
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
   * @example
   * ## Get public balance of an account
   * let mappingValue = connection.getMappingValue("credits.aleo", "account", "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px");
   */
  async getMappingValue(programId: string, mappingName: string, key: string): Promise<string | Error> {
    try {
      return await this.fetchData<string>("/program/" + programId + "/mapping/" + mappingName + "/" + key)
    } catch (error) {
      throw new Error("Error fetching mapping value - ensure the mapping exists and the key is correct");
    }
  }

  /**
   * Returns the block contents of the latest block
   *
   * @example
   * let latestHeight = connection.getLatestBlock();
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
   * let latestHash = connection.getLatestHash();
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
   * let latestHeight = connection.getLatestHeight();
   */
  async getLatestHeight(): Promise<number | Error> {
    try {
      return await this.fetchData<number>("/latest/height");
    } catch (error) {
      throw new Error("Error fetching latest height.");
    }
  }

  /**
   * Returns the latest state/merkle root of the Aleo blockchain
   *
   * @example
   * let stateRoot = connection.getStateRoot();
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
   * let transaction = connection.getTransaction("at1handz9xjrqeynjrr0xay4pcsgtnczdksz3e584vfsgaz0dh0lyxq43a4wj");
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
   * let transactions = connection.getTransactions(654);
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
   * let transactions = connection.getTransactionsInMempool();
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
   * let transition = connection.getTransitionId("2429232855236830926144356377868449890830704336664550203176918782554219952323field");
   */
  async getTransitionId(transition_id: string): Promise<Transition | Error> {
    try {
      return await this.fetchData<Transition>("/find/transitionID/" + transition_id);
    } catch (error) {
      throw new Error("Error fetching transition ID.");
    }
  }

  /**
   * Attempts to find unspent records in the Aleo blockchain for a specified private key
   *
   * @example
   * // Find all unspent records
   * const privateKey = "[PRIVATE_KEY]";
   * let records = connection.findUnspentRecords(0, undefined, privateKey);
   *
   * // Find specific amounts
   * const startHeight = 500000;
   * const amounts = [600000, 1000000];
   * let records = connection.findUnspentRecords(startHeight, undefined, privateKey, amounts);
   *
   * // Find specific amounts with a maximum number of cumulative microcredits
   * const maxMicrocredits = 100000;
   * let records = connection.findUnspentRecords(startHeight, undefined, privateKey, undefined, maxMicrocredits);
   */
  async findUnspentRecords(
    startHeight: number,
    endHeight: number | undefined,
    privateKey: string | undefined,
    amounts: number[] | undefined,
    maxMicrocredits: number | undefined,
  ): Promise<Array<RecordPlaintext> | Error> {
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
        resolvedPrivateKey = PrivateKey.from_string(privateKey);
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
    if (startHeight > end ) {
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
}
