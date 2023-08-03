import { __awaiter, __extends, __generator } from "tslib";
import init, { initThreadPool, ProgramManager as WasmProgramManager, } from '@aleohq/wasm';
import { AleoKeyProvider, AleoNetworkClient, RecordPlaintext, Program } from ".";
var ProgramManager = /** @class */ (function (_super) {
    __extends(ProgramManager, _super);
    function ProgramManager(host, keyProvider, recordProvider) {
        var _this = this;
        if (process.env.NODE_ENV === 'production') {
            throw ("ProgramManager is not available in NodeJS");
        }
        _this = _super.call(this) || this;
        if (typeof host === "undefined") {
            _this.host = "http://vm.aleo.org/api";
            _this.networkClient = new AleoNetworkClient(_this.host);
        }
        else {
            _this.host = host;
            _this.networkClient = new AleoNetworkClient(host);
        }
        if (typeof keyProvider === "undefined") {
            _this.keyProvider = new AleoKeyProvider();
        }
        else {
            _this.keyProvider = keyProvider;
        }
        _this.recordProvider = recordProvider;
        return _this;
    }
    /**
     * Set the account to use for transaction submission to the Aleo network
     *
     * @param account {Account} Account to use for transaction submission
     */
    ProgramManager.prototype.setAccount = function (account) {
        this.account = account;
    };
    /**
     * Set the key provider that provides the proving and verifying keys for programs
     *
     * @param keyProvider {FunctionKeyProvider}
     */
    ProgramManager.prototype.setKeyProvider = function (keyProvider) {
        this.keyProvider = keyProvider;
    };
    /**
     * Set the host peer to use for transaction submission to the Aleo network
     *
     * @param host {string} Peer url to use for transaction submission
     */
    ProgramManager.prototype.setHost = function (host) {
        this.host = host;
        this.networkClient.host = host;
    };
    /**
     * Set the record provider that provides records for transactions
     *
     * @param recordProvider {RecordProvider}
     */
    ProgramManager.prototype.setRecordProvider = function (recordProvider) {
        this.recordProvider = recordProvider;
    };
    /**
     * Initialize the program manager. This step is NECESSARY before any other methods can be called.
     *
     * @param threads {number | undefined} Number of threads to use for the thread pool. If undefined, defaults to 8.
     */
    ProgramManager.prototype.initialize = function (threads) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, init()];
                    case 1:
                        _a.sent();
                        if (!(typeof threads === "undefined")) return [3 /*break*/, 3];
                        return [4 /*yield*/, initThreadPool(8)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, initThreadPool(threads)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Deploy an Aleo program to the Aleo network
     *
     * @param program {string} Program source code
     * @param fee {number} Fee to pay for the transaction
     * @param cache {boolean} Whether to cache the program in memory
     * @param feeRecord {string | RecordPlaintext} Fee record to use for the transaction
     * @param privateKey {PrivateKey | undefined} Optional private key to use for the transaction
     * @returns {string | Error} The transaction id of the deployed program or a failure message from the network
     *
     * @example
     * // Create a new NetworkClient, KeyProvider, and RecordProvider
     * const networkClient = new AleoNetworkClient("https://vm.aleo.org/api");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for deployments
     * const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
     * const programManager = new ProgramManager(networkClient, keyProvider, recordProvider);
     * const tx_id = await programManager.deploy(program, fee, feeRecord)
     * const transaction = await programManager.networkClient.getTransaction(tx_id);
     */
    ProgramManager.prototype.deploy = function (program, fee, feeRecord, privateKey) {
        return __awaiter(this, void 0, void 0, function () {
            var deploymentPrivateKey, record, result, _a, feeProvingKey, feeVerifyingKey, imports, tx;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // Convert the fee to microcredits
                        fee = Math.floor(fee * 1000000);
                        deploymentPrivateKey = privateKey;
                        if (typeof privateKey === "undefined" && typeof this.account !== "undefined") {
                            deploymentPrivateKey = this.account.privateKey();
                        }
                        else {
                            throw ("No private key provided and no private key set in the ProgramManager");
                        }
                        record = feeRecord instanceof RecordPlaintext ? feeRecord : RecordPlaintext.fromString(feeRecord);
                        if (!this.keyExists("credits.aleo", "fee")) return [3 /*break*/, 1];
                        _a = [undefined, undefined];
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.keyProvider.feeKeys()];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        result = _a;
                        if (result instanceof Error) {
                            throw (result);
                        }
                        feeProvingKey = result[0], feeVerifyingKey = result[1];
                        imports = this.networkClient.getProgramImports(program);
                        return [4 /*yield*/, this.buildDeploymentTransaction(deploymentPrivateKey, program, fee, record, this.host, false, imports, feeProvingKey, feeVerifyingKey)];
                    case 4:
                        tx = _b.sent();
                        return [4 /*yield*/, this.networkClient.submitTransaction(tx)];
                    case 5: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    /**
     * Execute an Aleo program on the Aleo network
     *
     * @param program {string} Program source code containing the function to be executed
     * @param function_name {string} Function name to execute
     * @param fee {number} Fee to pay for the transaction
     * @param inputs {string[]} Inputs to the function
     * @param feeRecord {string | RecordPlaintext} Fee record to use for the transaction
     * @param privateKey {PrivateKey | undefined} Optional private key to use for the transaction
     * @param provingKey {ProvingKey | undefined} Optional proving key to use for the transaction
     * @param verifyingKey {VerifyingKey | undefined} Optional verifying key to use for the transaction
     * @returns {Promise<string | Error>}
     *
     * @example
     * // Create a new NetworkClient, KeyProvider, and RecordProvider
     * const networkClient = new AleoNetworkClient("https://vm.aleo.org/api");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions
     * const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
     * const programManager = new ProgramManager(networkClient, keyProvider, recordProvider);
     * const tx_id = await programManager.execute(program, "hello_hello", 0.020, ["5u32", "5u32"])
     * const transaction = await programManager.networkClient.getTransaction(tx_id);
     */
    ProgramManager.prototype.execute = function (program, function_name, fee, inputs, feeRecord, privateKey, provingKey, verifyingKey) {
        return __awaiter(this, void 0, void 0, function () {
            var executionPrivateKey, record, result, feeProvingKey, feeVerifyingKey, imports, tx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Convert the fee to microcredits
                        fee = Math.floor(fee * 1000000);
                        executionPrivateKey = privateKey;
                        if (typeof privateKey === "undefined" && typeof this.account !== "undefined") {
                            executionPrivateKey = this.account.privateKey();
                        }
                        else {
                            throw ("No private key provided and no private key set in the ProgramManager");
                        }
                        record = feeRecord instanceof RecordPlaintext ? feeRecord : RecordPlaintext.fromString(feeRecord);
                        return [4 /*yield*/, this.keyProvider.feeKeys()];
                    case 1:
                        result = _a.sent();
                        if (result instanceof Error) {
                            throw (result);
                        }
                        feeProvingKey = result[0], feeVerifyingKey = result[1];
                        imports = this.networkClient.getProgramImports(program);
                        return [4 /*yield*/, this.buildExecutionTransaction(executionPrivateKey, program, function_name, inputs, fee, record, this.host, false, imports, provingKey, verifyingKey, feeProvingKey, feeVerifyingKey)];
                    case 2:
                        tx = _a.sent();
                        return [4 /*yield*/, this.networkClient.submitTransaction(tx)];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Execute an Aleo program in offline mode
     *
     * @param program {string} Program source code containing the function to be executed
     * @param function_name {string} Function name to execute
     * @param inputs {string[]} Inputs to the function
     * @param privateKey {PrivateKey | undefined} Optional private key to use for the transaction
     * @param provingKey {ProvingKey | undefined} Optional proving key to use for the transaction
     * @param verifyingKey {VerifyingKey | undefined} Optional verifying key to use for the transaction
     * @returns {Promise<string | Error>}
     */
    ProgramManager.prototype.executeOffline = function (program, function_name, inputs, privateKey, provingKey, verifyingKey) {
        return __awaiter(this, void 0, void 0, function () {
            var executionPrivateKey, imports;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        executionPrivateKey = privateKey;
                        if (typeof privateKey === "undefined" && typeof this.account !== "undefined") {
                            executionPrivateKey = this.account.privateKey();
                        }
                        else {
                            throw ("No private key provided and no private key set in the ProgramManager");
                        }
                        imports = this.networkClient.getProgramImports(program);
                        return [4 /*yield*/, this.executeFunctionOffline(executionPrivateKey, program, function_name, inputs, false, imports, provingKey, verifyingKey)];
                    case 1: 
                    // Deploy the program and submit the transaction to the network
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Join two credits records into a single credits record
     *
     * @param recordOne {RecordPlaintext | string} First credits record to join
     * @param recordTwo {RecordPlaintext | string} Second credits record to join
     * @param fee {number} Fee in credits pay for the join transaction
     * @param feeRecord {RecordPlaintext | string} Fee record to use for the join transaction
     * @param privateKey {PrivateKey | undefined} Private key to use for the join transaction
     * @returns {Promise<string | Error>}
     */
    ProgramManager.prototype.join = function (recordOne, recordTwo, fee, feeRecord, privateKey) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var executionPrivateKey, feeKeys, joinKeys, feeProvingKey, feeVerifyingKey, joinProvingKey, joinVerifyingKey, tx;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        // Convert the fee to microcredits
                        fee = Math.floor(fee * 1000000);
                        executionPrivateKey = privateKey;
                        if (typeof privateKey === "undefined" && typeof this.account !== "undefined") {
                            executionPrivateKey = this.account.privateKey();
                        }
                        else {
                            throw ("No private key provided and no private key set in the ProgramManager");
                        }
                        return [4 /*yield*/, ((_a = this.keyProvider) === null || _a === void 0 ? void 0 : _a.feeKeys())];
                    case 1:
                        feeKeys = _c.sent();
                        return [4 /*yield*/, ((_b = this.keyProvider) === null || _b === void 0 ? void 0 : _b.joinKeys())];
                    case 2:
                        joinKeys = _c.sent();
                        if (feeKeys instanceof Error || joinKeys instanceof Error) {
                            throw ("Failed to get keys");
                        }
                        feeProvingKey = feeKeys[0], feeVerifyingKey = feeKeys[1];
                        joinProvingKey = joinKeys[0], joinVerifyingKey = joinKeys[1];
                        // Get record
                        recordOne = recordOne instanceof RecordPlaintext ? recordOne : RecordPlaintext.fromString(recordOne);
                        recordTwo = recordTwo instanceof RecordPlaintext ? recordTwo : RecordPlaintext.fromString(recordTwo);
                        feeRecord = feeRecord instanceof RecordPlaintext ? feeRecord : RecordPlaintext.fromString(feeRecord);
                        return [4 /*yield*/, this.buildJoinTransaction(executionPrivateKey, recordOne, recordTwo, fee, feeRecord, this.host, false, joinProvingKey, joinVerifyingKey, feeProvingKey, feeVerifyingKey)];
                    case 3:
                        tx = _c.sent();
                        return [4 /*yield*/, this.networkClient.submitTransaction(tx)];
                    case 4: return [2 /*return*/, _c.sent()];
                }
            });
        });
    };
    /**
     * Split credits into two new credits records
     *
     * @param splitAmount {number} Amount to split from the original credits record
     * @param recipient {string} Recipient of the split transaction
     * @param amountRecord {RecordPlaintext | string} Amount record to use for the split transaction
     * @param privateKey {PrivateKey | undefined} Private key to use for the split transaction
     * @returns {Promise<string | Error>}
     */
    ProgramManager.prototype.split = function (splitAmount, amountRecord, privateKey) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var executionPrivateKey, splitKeys, splitProvingKey, splitVerifyingKey, tx;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        executionPrivateKey = privateKey;
                        if (typeof privateKey === "undefined" && typeof this.account !== "undefined") {
                            executionPrivateKey = this.account.privateKey();
                        }
                        else {
                            throw ("No private key provided and no private key set in the ProgramManager");
                        }
                        return [4 /*yield*/, ((_a = this.keyProvider) === null || _a === void 0 ? void 0 : _a.splitKeys())];
                    case 1:
                        splitKeys = _b.sent();
                        if (splitKeys instanceof Error) {
                            throw ("Failed to get keys");
                        }
                        splitProvingKey = splitKeys[0], splitVerifyingKey = splitKeys[1];
                        // Get record
                        amountRecord = amountRecord instanceof RecordPlaintext ? amountRecord : RecordPlaintext.fromString(amountRecord);
                        return [4 /*yield*/, this.buildSplitTransaction(executionPrivateKey, splitAmount, amountRecord, this.host, false, splitProvingKey, splitVerifyingKey)];
                    case 2:
                        tx = _b.sent();
                        return [4 /*yield*/, this.networkClient.submitTransaction(tx)];
                    case 3: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    /**
     * Transfer credits to another account
     *
     * @param amount {number} The amount of credits to transfer
     * @param recipient {string} The recipient of the transfer
     * @param transfer_type
     * @param fee
     * @param amountRecord
     * @param feeRecord
     * @param privateKey
     * @returns {Promise<string | Error>}
     */
    ProgramManager.prototype.transfer = function (amount, recipient, transfer_type, fee, amountRecord, feeRecord, privateKey) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var executionPrivateKey, feeKeys, transferKeys, feeProvingKey, feeVerifyingKey, transferProvingKey, transferVerifyingKey, nonces, record, record, tx;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        // Convert the fee and amount to microcredits
                        amount = Math.floor(amount * 1000000);
                        fee = Math.floor(fee * 1000000);
                        executionPrivateKey = privateKey;
                        if (typeof privateKey === "undefined" && typeof this.account !== "undefined") {
                            executionPrivateKey = this.account.privateKey();
                        }
                        else {
                            throw ("No private key provided and no private key set in the ProgramManager");
                        }
                        return [4 /*yield*/, ((_a = this.keyProvider) === null || _a === void 0 ? void 0 : _a.feeKeys())];
                    case 1:
                        feeKeys = _c.sent();
                        return [4 /*yield*/, ((_b = this.keyProvider) === null || _b === void 0 ? void 0 : _b.transferKeys(transfer_type))];
                    case 2:
                        transferKeys = _c.sent();
                        if (feeKeys instanceof Error || transferKeys instanceof Error) {
                            throw ("Failed to get keys");
                        }
                        feeProvingKey = feeKeys[0], feeVerifyingKey = feeKeys[1];
                        transferProvingKey = transferKeys[0], transferVerifyingKey = transferKeys[1];
                        nonces = [];
                        if (!feeRecord) return [3 /*break*/, 3];
                        feeRecord = feeRecord instanceof RecordPlaintext ? feeRecord : RecordPlaintext.fromString(feeRecord);
                        nonces.push(feeRecord.nonce());
                        return [3 /*break*/, 6];
                    case 3:
                        if (!this.recordProvider) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.recordProvider.findCreditsRecord(fee, true, [])];
                    case 4:
                        record = _c.sent();
                        if (record instanceof RecordPlaintext) {
                            feeRecord = record;
                            nonces.push(feeRecord.nonce());
                        }
                        else {
                            console.log("Record provider did not return a valid record with error:", record);
                            throw ("The record provider did not return a valid record");
                        }
                        return [3 /*break*/, 6];
                    case 5: throw ("No record provider set and no fee record provided");
                    case 6:
                        if (!amountRecord) return [3 /*break*/, 7];
                        amountRecord = amountRecord instanceof RecordPlaintext ? amountRecord : RecordPlaintext.fromString(amountRecord);
                        return [3 /*break*/, 10];
                    case 7:
                        if (!(this.recordProvider && requiresAmountRecord(transfer_type))) return [3 /*break*/, 9];
                        return [4 /*yield*/, this.recordProvider.findCreditsRecord(amount, true, nonces)];
                    case 8:
                        record = _c.sent();
                        if (record instanceof RecordPlaintext) {
                            amountRecord = record;
                        }
                        else {
                            console.log("Record provider did not return a valid record with error:", record);
                            throw ("The record provider did not return a valid record");
                        }
                        return [3 /*break*/, 10];
                    case 9: throw ("No record provider set and no amount record provided");
                    case 10: return [4 /*yield*/, this.buildTransferTransaction(executionPrivateKey, amount, recipient, transfer_type, amountRecord, fee, feeRecord, this.host, false, transferProvingKey, transferVerifyingKey, feeProvingKey, feeVerifyingKey)];
                    case 11:
                        tx = _c.sent();
                        return [4 /*yield*/, this.networkClient.submitTransaction(tx)];
                    case 12: return [2 /*return*/, _c.sent()];
                }
            });
        });
    };
    /**
     * Create a program object from a program's source code
     *
     * @param program {string} Program source code
     * @returns {Program | Error} The program object
     */
    ProgramManager.prototype.createProgramFromSource = function (program) {
        return Program.fromString(program);
    };
    /**
     * Get the credits program object
     *
     * @returns {Program} The credits program object
     */
    ProgramManager.prototype.creditsProgram = function () {
        return Program.getCreditsProgram();
    };
    return ProgramManager;
}(WasmProgramManager));
function requiresAmountRecord(record_type) {
    switch (record_type) {
        case "transfer_private" || "private" || "transferPrivate":
            return true;
        case "transfer_private_to_public" || "privateToPublic" || "transferPrivateToPublic":
            return true;
        default:
            return false;
    }
}
export { ProgramManager };
//# sourceMappingURL=program-manager.js.map