import { __awaiter, __generator } from "tslib";
import axios from "axios";
import { RecordCiphertext, PrivateKey } from "@aleohq/wasm";
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
var AleoNetworkClient = /** @class */ (function () {
    function AleoNetworkClient(host) {
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
    AleoNetworkClient.prototype.setAccount = function (account) {
        this.account = account;
    };
    /**
     * Return the Aleo account used in the node connection
     *
     * @example
     * let account = connection.getAccount();
     */
    AleoNetworkClient.prototype.getAccount = function () {
        return this.account;
    };
    AleoNetworkClient.prototype.fetchData = function (url) {
        if (url === void 0) { url = "/"; }
        return __awaiter(this, void 0, void 0, function () {
            var response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios.get(this.host + url)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        error_1 = _a.sent();
                        throw new Error("Error fetching data.");
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns the block contents of the block at the specified block height
     *
     * @param {number} height
     * @example
     * let block = connection.getBlock(1234);
     */
    AleoNetworkClient.prototype.getBlock = function (height) {
        return __awaiter(this, void 0, void 0, function () {
            var block, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/block/" + height)];
                    case 1:
                        block = _a.sent();
                        return [2 /*return*/, block];
                    case 2:
                        error_2 = _a.sent();
                        throw new Error("Error fetching block.");
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns a range of blocks between the specified block heights
     *
     * @param {number} start
     * @param {number} end
     * @example
     * let blockRange = connection.getBlockRange(2050, 2100);
     */
    AleoNetworkClient.prototype.getBlockRange = function (start, end) {
        return __awaiter(this, void 0, void 0, function () {
            var error_3, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/blocks?start=" + start + "&end=" + end)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_3 = _a.sent();
                        errorMessage = "Error fetching blocks between " + start + " and " + end + ".";
                        throw new Error(errorMessage);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns the source code of a program
     *
     * @param {string} programId
     * @example
     * let program = connection.getProgram("foo.aleo");
     */
    AleoNetworkClient.prototype.getProgram = function (programId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/program/" + programId)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_4 = _a.sent();
                        throw new Error("Error fetching program");
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns the block contents of the latest block
     *
     * @example
     * let latestHeight = connection.getLatestBlock();
     */
    AleoNetworkClient.prototype.getLatestBlock = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/latest/block")];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_5 = _a.sent();
                        throw new Error("Error fetching latest block.");
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns the hash of the last published block
     *
     * @example
     * let latestHash = connection.getLatestHash();
     */
    AleoNetworkClient.prototype.getLatestHash = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/latest/hash")];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_6 = _a.sent();
                        throw new Error("Error fetching latest hash.");
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns the latest block height
     *
     * @example
     * let latestHeight = connection.getLatestHeight();
     */
    AleoNetworkClient.prototype.getLatestHeight = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/latest/height")];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_7 = _a.sent();
                        throw new Error("Error fetching latest height.");
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns the latest state/merkle root of the Aleo blockchain
     *
     * @example
     * let stateRoot = connection.getStateRoot();
     */
    AleoNetworkClient.prototype.getStateRoot = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/latest/stateRoot")];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_8 = _a.sent();
                        throw new Error("Error fetching Aleo state root");
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns a transaction by its unique identifier
     *
     * @param {string} id
     * @example
     * let transaction = connection.getTransaction("at1handz9xjrqeynjrr0xay4pcsgtnczdksz3e584vfsgaz0dh0lyxq43a4wj");
     */
    AleoNetworkClient.prototype.getTransaction = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/transaction/" + id)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_9 = _a.sent();
                        throw new Error("Error fetching transaction.");
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns the transactions present at the specified block height
     *
     * @param {number} height
     * @example
     * let transactions = connection.getTransactions(654);
     */
    AleoNetworkClient.prototype.getTransactions = function (height) {
        return __awaiter(this, void 0, void 0, function () {
            var error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/block/" + height.toString() + "/transactions")];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_10 = _a.sent();
                        throw new Error("Error fetching transactions.");
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns the transactions in the memory pool.
     *
     * @example
     * let transactions = connection.getTransactionsInMempool();
     */
    AleoNetworkClient.prototype.getTransactionsInMempool = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/memoryPool/transactions")];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_11 = _a.sent();
                        throw new Error("Error fetching transactions from mempool.");
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns the transition id by its unique identifier
     *
     * @example
     * let transition = connection.getTransitionId("2429232855236830926144356377868449890830704336664550203176918782554219952323field");
     */
    AleoNetworkClient.prototype.getTransitionId = function (transition_id) {
        return __awaiter(this, void 0, void 0, function () {
            var error_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/find/transitionID/" + transition_id)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_12 = _a.sent();
                        throw new Error("Error fetching transition ID.");
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Attempts to find unspent records in the Aleo blockchain for a specified private key
     *
     * @example
     * // Find all unspent records
     * const private_key = "[PRIVATE_KEY]";
     * let records = connection.findUnspentRecords(0, undefined, private_key);
     *
     * // Find specific amounts
     * const start_height = 500000;
     * const amounts = [600000, 1000000];
     * let records = connection.findUnspentRecords(start_height, undefined, private_key, amounts);
     *
     * // Find specific amounts with a maximum number of cumulative gates
     * const max_gates = 100000;
     * let records = connection.findUnspentRecords(start_height, undefined, private_key, undefined, max_gates);
     */
    AleoNetworkClient.prototype.findUnspentRecords = function (start_height, end_height, private_key, amounts, max_gates) {
        return __awaiter(this, void 0, void 0, function () {
            var records, start, end, pk, failures, total_record_value, latest_height, vk, block_height, error_13, blocks, i, block, transactions, j, transaction, k, transition, l, output, record, record_plaintext, serial_number, error_14, amounts_found, m, n, error_15, error_16;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Ensure start height is not negative
                        if (start_height < 0) {
                            throw new Error("Start height must be greater than or equal to 0");
                        }
                        records = new Array();
                        failures = 0;
                        total_record_value = BigInt(0);
                        // Ensure a private key is present to find owned records
                        if (typeof private_key === "undefined") {
                            if (typeof this.account === "undefined") {
                                throw new Error("Private key must be specified in an argument to findOwnedRecords or set in the AleoNetworkClient");
                            }
                            else {
                                pk = this.account.pk;
                            }
                        }
                        else {
                            try {
                                pk = PrivateKey.from_string(private_key);
                            }
                            catch (error) {
                                throw new Error("Error parsing private key provided.");
                            }
                        }
                        vk = pk.to_view_key();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.getLatestHeight()];
                    case 2:
                        block_height = _a.sent();
                        if (typeof block_height === "number") {
                            latest_height = block_height;
                        }
                        else {
                            throw new Error("Error fetching latest block height.");
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_13 = _a.sent();
                        throw new Error("Error fetching latest block height.");
                    case 4:
                        // If no end height is specified or is greater than the latest height, set the end height to the latest height
                        if (typeof end_height === "number" && end_height <= latest_height) {
                            end = end_height;
                        }
                        else {
                            end = latest_height;
                        }
                        // If the starting is greater than the ending height, return an error
                        if (start_height > end) {
                            throw new Error("Start height must be less than or equal to end height.");
                        }
                        _a.label = 5;
                    case 5:
                        if (!(end > start_height)) return [3 /*break*/, 25];
                        start = end - 50;
                        if (start < start_height) {
                            start = start_height;
                        }
                        _a.label = 6;
                    case 6:
                        _a.trys.push([6, 23, , 24]);
                        return [4 /*yield*/, this.getBlockRange(start, end)];
                    case 7:
                        blocks = _a.sent();
                        end = start;
                        if (!!(blocks instanceof Error)) return [3 /*break*/, 22];
                        i = 0;
                        _a.label = 8;
                    case 8:
                        if (!(i < blocks.length)) return [3 /*break*/, 22];
                        block = blocks[i];
                        transactions = block.transactions;
                        if (!!(typeof transactions === "undefined")) return [3 /*break*/, 21];
                        j = 0;
                        _a.label = 9;
                    case 9:
                        if (!(j < transactions.length)) return [3 /*break*/, 21];
                        transaction = transactions[j];
                        if (!(transaction.type == "execute")) return [3 /*break*/, 20];
                        if (!!(typeof transaction.execution.transitions == "undefined")) return [3 /*break*/, 20];
                        k = 0;
                        _a.label = 10;
                    case 10:
                        if (!(k < transaction.execution.transitions.length)) return [3 /*break*/, 20];
                        transition = transaction.execution.transitions[k];
                        // Only search for unspent records in credits.aleo (for now)
                        if (transition.program !== "credits.aleo") {
                            return [3 /*break*/, 19];
                        }
                        if (!!(typeof transition.outputs == "undefined")) return [3 /*break*/, 19];
                        l = 0;
                        _a.label = 11;
                    case 11:
                        if (!(l < transition.outputs.length)) return [3 /*break*/, 19];
                        output = transition.outputs[l];
                        if (!(output.type === "record")) return [3 /*break*/, 18];
                        _a.label = 12;
                    case 12:
                        _a.trys.push([12, 17, , 18]);
                        record = RecordCiphertext.fromString(output.value);
                        if (!record.isOwner(vk)) return [3 /*break*/, 16];
                        record_plaintext = record.decrypt(vk);
                        serial_number = record_plaintext.serialNumberString(pk, "credits.aleo", "credits");
                        _a.label = 13;
                    case 13:
                        _a.trys.push([13, 15, , 16]);
                        return [4 /*yield*/, this.getTransitionId(serial_number)];
                    case 14:
                        _a.sent();
                        return [3 /*break*/, 16];
                    case 15:
                        error_14 = _a.sent();
                        // If it's not found, add it to the list of unspent records
                        records.push(record_plaintext);
                        // If the user specified a maximum number of gates, check if the search has found enough
                        if (typeof max_gates === "number") {
                            total_record_value = record_plaintext.gates();
                            // Exit if the search has found the amount specified
                            if (total_record_value >= BigInt(max_gates)) {
                                return [2 /*return*/, records];
                            }
                        }
                        // If the user specified a list of amounts, check if the search has found them
                        if (!(typeof amounts == "undefined")) {
                            amounts_found = 0;
                            for (m = 0; m < amounts.length; m++) {
                                for (n = 0; m < records.length; n++) {
                                    if (records[n].gates() >= BigInt(amounts[m])) {
                                        amounts_found++;
                                        // Exit if the search has found the amounts specified
                                        if (amounts_found >= amounts.length) {
                                            return [2 /*return*/, records];
                                        }
                                    }
                                }
                            }
                        }
                        return [3 /*break*/, 16];
                    case 16: return [3 /*break*/, 18];
                    case 17:
                        error_15 = _a.sent();
                        return [3 /*break*/, 18];
                    case 18:
                        l++;
                        return [3 /*break*/, 11];
                    case 19:
                        k++;
                        return [3 /*break*/, 10];
                    case 20:
                        j++;
                        return [3 /*break*/, 9];
                    case 21:
                        i++;
                        return [3 /*break*/, 8];
                    case 22: return [3 /*break*/, 24];
                    case 23:
                        error_16 = _a.sent();
                        // If there is an error fetching blocks, log it and keep searching
                        console.log("Error fetching blocks in range: " + start.toString() + "-" + end.toString());
                        console.log("Error: ", error_16);
                        failures += 1;
                        if (failures > 10) {
                            console.log("10 failures fetching records reached. Returning records fetched so far");
                            return [2 /*return*/, records];
                        }
                        return [3 /*break*/, 24];
                    case 24: return [3 /*break*/, 5];
                    case 25: return [2 /*return*/, records];
                }
            });
        });
    };
    return AleoNetworkClient;
}());
export { AleoNetworkClient };
//# sourceMappingURL=aleo_network_client.js.map