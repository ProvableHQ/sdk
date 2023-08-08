import { __awaiter, __generator } from "tslib";
import axios from "axios";
import { RecordCiphertext, Program, PrivateKey, WasmTransaction, logAndThrow } from ".";
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
var AleoNetworkClient = /** @class */ (function () {
    function AleoNetworkClient(host) {
        this.host = host + "/testnet3";
    }
    /**
     * Set an account to use in networkClient calls
     *
     * @param {Account} account
     * @example
     * const account = new Account();
     * networkClient.setAccount(account);
     */
    AleoNetworkClient.prototype.setAccount = function (account) {
        this.account = account;
    };
    /**
     * Return the Aleo account used in the networkClient
     *
     * @example
     * const account = networkClient.getAccount();
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
     * Attempts to find unspent records in the Aleo blockchain for a specified private key
     * @param {number} startHeight - The height at which to start searching for unspent records
     * @param {number} endHeight - The height at which to stop searching for unspent records
     * @param {string | PrivateKey} privateKey - The private key to use to find unspent records
     * @param {number[]} amounts - The amounts (in microcredits) to search for (eg. [100, 200, 3000])
     * @param {number} maxMicrocredits - The maximum number of microcredits to search for
     * @param {string[]} nonces - The nonces of already found records to exclude from the search
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
    AleoNetworkClient.prototype.findUnspentRecords = function (startHeight, endHeight, privateKey, amounts, maxMicrocredits, nonces) {
        return __awaiter(this, void 0, void 0, function () {
            var records, start, end, resolvedPrivateKey, failures, totalRecordValue, latestHeight, viewKey, blockHeight, error_2, blocks, i, block, transactions, j, confirmedTransaction, transaction, k, transition, l, output, record, recordPlaintext, nonce, serialNumber, error_3, amounts_found, error_4, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        nonces = nonces || [];
                        // Ensure start height is not negative
                        if (startHeight < 0) {
                            throw new Error("Start height must be greater than or equal to 0");
                        }
                        records = new Array();
                        failures = 0;
                        totalRecordValue = BigInt(0);
                        // Ensure a private key is present to find owned records
                        if (typeof privateKey === "undefined") {
                            if (typeof this.account === "undefined") {
                                throw new Error("Private key must be specified in an argument to findOwnedRecords or set in the AleoNetworkClient");
                            }
                            else {
                                resolvedPrivateKey = this.account._privateKey;
                            }
                        }
                        else {
                            try {
                                resolvedPrivateKey = privateKey instanceof PrivateKey ? privateKey : PrivateKey.from_string(privateKey);
                            }
                            catch (error) {
                                throw new Error("Error parsing private key provided.");
                            }
                        }
                        viewKey = resolvedPrivateKey.to_view_key();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.getLatestHeight()];
                    case 2:
                        blockHeight = _a.sent();
                        if (typeof blockHeight === "number") {
                            latestHeight = blockHeight;
                        }
                        else {
                            throw new Error("Error fetching latest block height.");
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        throw new Error("Error fetching latest block height.");
                    case 4:
                        // If no end height is specified or is greater than the latest height, set the end height to the latest height
                        if (typeof endHeight === "number" && endHeight <= latestHeight) {
                            end = endHeight;
                        }
                        else {
                            end = latestHeight;
                        }
                        // If the starting is greater than the ending height, return an error
                        if (startHeight > end) {
                            throw new Error("Start height must be less than or equal to end height.");
                        }
                        _a.label = 5;
                    case 5:
                        if (!(end > startHeight)) return [3 /*break*/, 25];
                        start = end - 50;
                        if (start < startHeight) {
                            start = startHeight;
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
                        confirmedTransaction = transactions[j];
                        if (!(confirmedTransaction.type == "execute")) return [3 /*break*/, 20];
                        transaction = confirmedTransaction.transaction;
                        if (!(transaction.execution && !(typeof transaction.execution.transitions == "undefined"))) return [3 /*break*/, 20];
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
                        if (!record.isOwner(viewKey)) return [3 /*break*/, 16];
                        recordPlaintext = record.decrypt(viewKey);
                        nonce = recordPlaintext.nonce();
                        if (nonces.includes(nonce)) {
                            return [3 /*break*/, 18];
                        }
                        serialNumber = recordPlaintext.serialNumberString(resolvedPrivateKey, "credits.aleo", "credits");
                        _a.label = 13;
                    case 13:
                        _a.trys.push([13, 15, , 16]);
                        return [4 /*yield*/, this.getTransitionId(serialNumber)];
                    case 14:
                        _a.sent();
                        return [3 /*break*/, 16];
                    case 15:
                        error_3 = _a.sent();
                        // If it's not found, add it to the list of unspent records
                        if (!amounts) {
                            records.push(recordPlaintext);
                            // If the user specified a maximum number of microcredits, check if the search has found enough
                            if (typeof maxMicrocredits === "number") {
                                totalRecordValue += recordPlaintext.microcredits();
                                // Exit if the search has found the amount specified
                                if (totalRecordValue >= BigInt(maxMicrocredits)) {
                                    return [2 /*return*/, records];
                                }
                            }
                        }
                        // If the user specified a list of amounts, check if the search has found them
                        if (!(typeof amounts === "undefined") && amounts.length > 0) {
                            amounts_found = 0;
                            if (recordPlaintext.microcredits() > amounts[amounts_found]) {
                                amounts_found += 1;
                                records.push(recordPlaintext);
                                // If the user specified a maximum number of microcredits, check if the search has found enough
                                if (typeof maxMicrocredits === "number") {
                                    totalRecordValue += recordPlaintext.microcredits();
                                    // Exit if the search has found the amount specified
                                    if (totalRecordValue >= BigInt(maxMicrocredits)) {
                                        return [2 /*return*/, records];
                                    }
                                }
                                if (records.length >= amounts.length) {
                                    return [2 /*return*/, records];
                                }
                            }
                        }
                        return [3 /*break*/, 16];
                    case 16: return [3 /*break*/, 18];
                    case 17:
                        error_4 = _a.sent();
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
                        error_5 = _a.sent();
                        // If there is an error fetching blocks, log it and keep searching
                        console.warn("Error fetching blocks in range: " + start.toString() + "-" + end.toString());
                        console.warn("Error: ", error_5);
                        failures += 1;
                        if (failures > 10) {
                            console.warn("10 failures fetching records reached. Returning records fetched so far");
                            return [2 /*return*/, records];
                        }
                        return [3 /*break*/, 24];
                    case 24: return [3 /*break*/, 5];
                    case 25: return [2 /*return*/, records];
                }
            });
        });
    };
    /**
     * Returns the contents of the block at the specified block height
     *
     * @param {number} height
     * @example
     * const block = networkClient.getBlock(1234);
     */
    AleoNetworkClient.prototype.getBlock = function (height) {
        return __awaiter(this, void 0, void 0, function () {
            var block, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/block/" + height)];
                    case 1:
                        block = _a.sent();
                        return [2 /*return*/, block];
                    case 2:
                        error_6 = _a.sent();
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
     * const blockRange = networkClient.getBlockRange(2050, 2100);
     */
    AleoNetworkClient.prototype.getBlockRange = function (start, end) {
        return __awaiter(this, void 0, void 0, function () {
            var error_7, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/blocks?start=" + start + "&end=" + end)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_7 = _a.sent();
                        errorMessage = "Error fetching blocks between " + start + " and " + end + ".";
                        throw new Error(errorMessage);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns the contents of the latest block
     *
     * @example
     * const latestHeight = networkClient.getLatestBlock();
     */
    AleoNetworkClient.prototype.getLatestBlock = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/latest/block")];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_8 = _a.sent();
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
     * const latestHash = networkClient.getLatestHash();
     */
    AleoNetworkClient.prototype.getLatestHash = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/latest/hash")];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_9 = _a.sent();
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
     * const latestHeight = networkClient.getLatestHeight();
     */
    AleoNetworkClient.prototype.getLatestHeight = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/latest/height")];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_10 = _a.sent();
                        throw new Error("Error fetching latest height.");
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns the source code of a program given a program ID
     *
     * @param {string} programId The program ID of a program deployed to the Aleo Network
     * @return {Promise<string>} Source code of the program
     *
     * @example
     * const program = networkClient.getProgram("hello_hello.aleo");
     * const expectedSource = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n"
     * assert.equal(program, expectedSource);
     */
    AleoNetworkClient.prototype.getProgram = function (programId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/program/" + programId)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_11 = _a.sent();
                        throw new Error("Error fetching program");
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns a program object from a program ID or program source code
     *
     * @param {string} inputProgram The program ID or program source code of a program deployed to the Aleo Network
     * @return {Promise<Program | Error>} Source code of the program
     *
     * @example
     * const programID = "hello_hello.aleo";
     * const programSource = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n"
     *
     * // Get program object from program ID or program source code
     * const programObjectFromID = await networkClient.getProgramObject(programID);
     * const programObjectFromSource = await networkClient.getProgramObject(programSource);
     *
     * // Both program objects should be equal
     * assert.equal(programObjectFromID.to_string(), programObjectFromSource.to_string());
     */
    AleoNetworkClient.prototype.getProgramObject = function (inputProgram) {
        return __awaiter(this, void 0, void 0, function () {
            var error_12, _a, _b, error_13;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 1, , 6]);
                        return [2 /*return*/, Program.fromString(inputProgram)];
                    case 1:
                        error_12 = _c.sent();
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 4, , 5]);
                        _b = (_a = Program).fromString;
                        return [4 /*yield*/, this.getProgram(inputProgram)];
                    case 3: return [2 /*return*/, _b.apply(_a, [(_c.sent())])];
                    case 4:
                        error_13 = _c.sent();
                        throw new Error("".concat(inputProgram, " is neither a program name or a valid program"));
                    case 5: return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     *  Returns an object containing the source code of a program and the source code of all programs it imports
     *
     * @param {Program | string} inputProgram The program ID or program source code of a program deployed to the Aleo Network
     * @returns {Promise<ProgramImports>} Object of the form { "program_id": "program_source", .. } containing program id & source code for all program imports
     *
     * @example
     * const double_test_source = "import multiply_test.aleo;\n\nprogram double_test.aleo;\n\nfunction double_it:\n    input r0 as u32.private;\n    call multiply_test.aleo/multiply 2u32 r0 into r1;\n    output r1 as u32.private;\n"
     * const double_test = Program.fromString(double_test_source);
     * const expectedImports = {
     *     "multiply_test.aleo": "program multiply_test.aleo;\n\nfunction multiply:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    mul r0 r1 into r2;\n    output r2 as u32.private;\n"
     * }
     *
     * // Imports can be fetched using the program ID, source code, or program object
     * let programImports = await networkClient.getProgramImports("double_test.aleo");
     * assert.deepStrictEqual(programImports, expectedImports);
     *
     * // Using the program source code
     * programImports = await networkClient.getProgramImports(double_test_source);
     * assert.deepStrictEqual(programImports, expectedImports);
     *
     * // Using the program object
     * programImports = await networkClient.getProgramImports(double_test);
     * assert.deepStrictEqual(programImports, expectedImports);
     */
    AleoNetworkClient.prototype.getProgramImports = function (inputProgram) {
        return __awaiter(this, void 0, void 0, function () {
            var imports, program, _a, importList, i, import_id, programSource, nestedImports, key, error_14;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 9, , 10]);
                        imports = {};
                        if (!(inputProgram instanceof Program)) return [3 /*break*/, 1];
                        _a = inputProgram;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getProgramObject(inputProgram)];
                    case 2:
                        _a = (_b.sent());
                        _b.label = 3;
                    case 3:
                        program = _a;
                        importList = program.getImports();
                        i = 0;
                        _b.label = 4;
                    case 4:
                        if (!(i < importList.length)) return [3 /*break*/, 8];
                        import_id = importList[i];
                        if (!!imports.hasOwnProperty(import_id)) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.getProgram(import_id)];
                    case 5:
                        programSource = _b.sent();
                        return [4 /*yield*/, this.getProgramImports(import_id)];
                    case 6:
                        nestedImports = _b.sent();
                        for (key in nestedImports) {
                            if (!imports.hasOwnProperty(key)) {
                                imports[key] = nestedImports[key];
                            }
                        }
                        imports[import_id] = programSource;
                        _b.label = 7;
                    case 7:
                        i++;
                        return [3 /*break*/, 4];
                    case 8: return [2 /*return*/, imports];
                    case 9:
                        error_14 = _b.sent();
                        throw logAndThrow("Error fetching program imports: " + error_14);
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get a list of the program names that a program imports
     *
     * @param {Program | string} inputProgram - The program id or program source code to get the imports of
     * @returns {string[]} - The list of program names that the program imports
     *
     * @example
     * const programImportsNames = networkClient.getProgramImports("double_test.aleo");
     * const expectedImportsNames = ["multiply_test.aleo"];
     * assert.deepStrictEqual(programImportsNames, expectedImportsNames);
     */
    AleoNetworkClient.prototype.getProgramImportNames = function (inputProgram) {
        return __awaiter(this, void 0, void 0, function () {
            var program, _a, error_15;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        if (!(inputProgram instanceof Program)) return [3 /*break*/, 1];
                        _a = inputProgram;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getProgramObject(inputProgram)];
                    case 2:
                        _a = (_b.sent());
                        _b.label = 3;
                    case 3:
                        program = _a;
                        return [2 /*return*/, program.getImports()];
                    case 4:
                        error_15 = _b.sent();
                        throw new Error("Error fetching program imports with error: " + error_15);
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns the names of the mappings of a program
     *
     * @param {string} programId - The program ID to get the mappings of (e.g. "credits.aleo")
     * @example
     * const mappings = networkClient.getProgramMappingNames("credits.aleo");
     * const expectedMappings = ["account"];
     * assert.deepStrictEqual(mappings, expectedMappings);
     */
    AleoNetworkClient.prototype.getProgramMappingNames = function (programId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_16;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/program/" + programId + "/mappings")];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_16 = _a.sent();
                        throw new Error("Error fetching program mappings - ensure the program exists on chain before trying again");
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns the value of a program's mapping for a specific key
     *
     * @param {string} programId - The program ID to get the mapping value of (e.g. "credits.aleo")
     * @param {string} mappingName - The name of the mapping to get the value of (e.g. "account")
     * @param {string} key - The key of the mapping to get the value of (e.g. "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px")
     * @return {Promise<string>} String representation of the value of the mapping
     *
     * @example
     * // Get public balance of an account
     * const mappingValue = networkClient.getMappingValue("credits.aleo", "account", "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px");
     * const expectedValue = "0u64";
     * assert.equal(mappingValue, expectedValue);
     */
    AleoNetworkClient.prototype.getProgramMappingValue = function (programId, mappingName, key) {
        return __awaiter(this, void 0, void 0, function () {
            var error_17;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/program/" + programId + "/mapping/" + mappingName + "/" + key)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_17 = _a.sent();
                        throw new Error("Error fetching mapping value - ensure the mapping exists and the key is correct");
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns the latest state/merkle root of the Aleo blockchain
     *
     * @example
     * const stateRoot = networkClient.getStateRoot();
     */
    AleoNetworkClient.prototype.getStateRoot = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_18;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/latest/stateRoot")];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_18 = _a.sent();
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
     * const transaction = networkClient.getTransaction("at1handz9xjrqeynjrr0xay4pcsgtnczdksz3e584vfsgaz0dh0lyxq43a4wj");
     */
    AleoNetworkClient.prototype.getTransaction = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var error_19;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/transaction/" + id)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_19 = _a.sent();
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
     * const transactions = networkClient.getTransactions(654);
     */
    AleoNetworkClient.prototype.getTransactions = function (height) {
        return __awaiter(this, void 0, void 0, function () {
            var error_20;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/block/" + height.toString() + "/transactions")];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_20 = _a.sent();
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
     * const transactions = networkClient.getTransactionsInMempool();
     */
    AleoNetworkClient.prototype.getTransactionsInMempool = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_21;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/memoryPool/transactions")];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_21 = _a.sent();
                        throw new Error("Error fetching transactions from mempool.");
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns the transition id by its unique identifier
     * @param {string} transition_id - The transition id to get
     *
     * @example
     * const transition = networkClient.getTransitionId("2429232855236830926144356377868449890830704336664550203176918782554219952323field");
     */
    AleoNetworkClient.prototype.getTransitionId = function (transition_id) {
        return __awaiter(this, void 0, void 0, function () {
            var error_22;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/find/transitionID/" + transition_id)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_22 = _a.sent();
                        throw new Error("Error fetching transition ID.");
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Submit an execute or deployment transaction to the Aleo network
     *
     * @param {WasmTransaction | string} transaction  - The transaction to submit to the network
     * @returns {string | Error} - The transaction id of the submitted transaction or the resulting error
     */
    AleoNetworkClient.prototype.submitTransaction = function (transaction) {
        return __awaiter(this, void 0, void 0, function () {
            var transaction_string, response, error_23;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        transaction_string = transaction instanceof WasmTransaction ? transaction.toString() : transaction;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, axios
                                .post(this.host + "/testnet3/transaction/broadcast", transaction_string, {
                                headers: {
                                    "Content-Type": "application/json"
                                }
                            })];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 3:
                        error_23 = _a.sent();
                        throw new Error("Error posting transaction: ".concat(error_23));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return AleoNetworkClient;
}());
export { AleoNetworkClient };
//# sourceMappingURL=network-client.js.map