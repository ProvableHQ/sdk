import { __awaiter, __extends, __generator } from "tslib";
import { ProgramManager as WasmProgramManager, } from '@aleohq/wasm';
import { AleoKeyProvider, AleoNetworkClient, RecordPlaintext, Program, logAndThrow } from ".";
/**
 * The ProgramManager class is used to execute and deploy programs on the Aleo network and create value transfers.
 */
var ProgramManager = /** @class */ (function (_super) {
    __extends(ProgramManager, _super);
    /** Create a new instance of the ProgramManager
     *
     * @param { string | undefined } host A host uri running the official Aleo API
     * @param { FunctionKeyProvider | undefined } keyProvider A key provider that implements {@link FunctionKeyProvider} interface
     * @param { RecordProvider | undefined } recordProvider A record provider that implements {@link RecordProvider} interface
     */
    function ProgramManager(host, keyProvider, recordProvider) {
        var _this = this;
        if (process.env.NODE_ENV === 'production') {
            throw ("ProgramManager is not available in NodeJS");
        }
        _this = _super.call(this) || this;
        if (!host) {
            _this.host = "http://vm.aleo.org/api";
            _this.networkClient = new AleoNetworkClient(_this.host);
        }
        else {
            _this.host = host;
            _this.networkClient = new AleoNetworkClient(host);
        }
        if (!keyProvider) {
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
     * @param {Account} account Account to use for transaction submission
     */
    ProgramManager.prototype.setAccount = function (account) {
        this.account = account;
    };
    /**
     * Set the key provider that provides the proving and verifying keys for programs
     *
     * @param {FunctionKeyProvider} keyProvider
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
     * @param {RecordProvider} recordProvider
     */
    ProgramManager.prototype.setRecordProvider = function (recordProvider) {
        this.recordProvider = recordProvider;
    };
    /**
     * Deploy an Aleo program to the Aleo network
     *
     * @param {string} program Program source code
     * @param {number} fee Fee to pay for the transaction
     * @param {RecordSearchParams | undefined} recordSearchParams Optional parameters for searching for a record to use for the transaction
     * @param {string | RecordPlaintext | undefined} feeRecord Optional Fee record to use for the transaction
     * @param {PrivateKey | undefined} privateKey Optional private key to use for the transaction
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
     * const programManager = new ProgramManager("https://vm.aleo.org/api", keyProvider, recordProvider);
     * await programManager.initialize();
     * const tx_id = await programManager.deploy(program, fee, feeRecord)
     * const transaction = await programManager.networkClient.getTransaction(tx_id);
     */
    ProgramManager.prototype.deploy = function (program, fee, recordSearchParams, feeRecord, privateKey) {
        return __awaiter(this, void 0, void 0, function () {
            var programObject, programSource, deploymentPrivateKey, e_1, feeKeys, e_2, feeProvingKey, feeVerifyingKey, imports, e_3, tx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Ensure the program is valid and does not exist on the network
                        try {
                            programObject = Program.fromString(program);
                            programSource = void 0;
                            try {
                                programSource = this.networkClient.getProgram(programObject.id());
                            }
                            catch (e) {
                                // Program does not exist on the network, deployment can proceed
                                console.log("Program ".concat(programObject.id(), " does not exist on the network, deploying..."));
                            }
                            if (typeof programSource == "string") {
                                throw ("Program ".concat(programObject.id(), " already exists on the network, please rename your program"));
                            }
                        }
                        catch (e) {
                            throw logAndThrow("Error validating program: ".concat(e));
                        }
                        // Convert the fee to microcredits
                        fee = Math.floor(fee * 1000000);
                        deploymentPrivateKey = privateKey;
                        if (typeof privateKey === "undefined" && typeof this.account !== "undefined") {
                            deploymentPrivateKey = this.account.privateKey();
                        }
                        else {
                            throw ("No private key provided and no private key set in the ProgramManager");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.getCreditsRecord(fee, [], feeRecord, recordSearchParams)];
                    case 2:
                        feeRecord = (_a.sent());
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        throw logAndThrow("Error finding fee record. Record finder response: '".concat(e_1, "'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists."));
                    case 4:
                        _a.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, this.keyProvider.feeKeys()];
                    case 5:
                        feeKeys = (_a.sent());
                        return [3 /*break*/, 7];
                    case 6:
                        e_2 = _a.sent();
                        throw logAndThrow("Error finding fee keys. Key finder response: '".concat(e_2, "'. Please ensure your key provider is configured correctly."));
                    case 7:
                        feeProvingKey = feeKeys[0], feeVerifyingKey = feeKeys[1];
                        _a.label = 8;
                    case 8:
                        _a.trys.push([8, 10, , 11]);
                        return [4 /*yield*/, this.networkClient.getProgramImports(program)];
                    case 9:
                        imports = _a.sent();
                        return [3 /*break*/, 11];
                    case 10:
                        e_3 = _a.sent();
                        throw logAndThrow("Error finding program imports. Network response: '".concat(e_3, "'. Please ensure you're connected to a valid Aleo network and the program is deployed to the network."));
                    case 11: return [4 /*yield*/, this.buildDeploymentTransaction(deploymentPrivateKey, program, fee, feeRecord, this.host, false, imports, feeProvingKey, feeVerifyingKey)];
                    case 12:
                        tx = _a.sent();
                        return [4 /*yield*/, this.networkClient.submitTransaction(tx)];
                    case 13: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Execute an Aleo program on the Aleo network
     *
     * @param {string} programName Program name containing the function to be executed
     * @param {string} functionName Function name to execute
     * @param {number} fee Fee to pay for the transaction
     * @param {string[]} inputs Inputs to the function
     * @param {RecordSearchParams} recordSearchParams Optional parameters for searching for a record to use for the transaction
     * @param {KeySearchParams} keySearchParams Optional parameters for finding the matching proving & verifying keys for the function
     * @param {string | RecordPlaintext | undefined} feeRecord Optional Fee record to use for the transaction
     * @param {ProvingKey | undefined} provingKey Optional proving key to use for the transaction
     * @param {VerifyingKey | undefined} verifyingKey Optional verifying key to use for the transaction
     * @param {PrivateKey | undefined} privateKey Optional private key to use for the transaction
     * @returns {Promise<string | Error>}
     *
     * @example
     * // Create a new NetworkClient, KeyProvider, and RecordProvider using official Aleo record, key, and network providers
     * const networkClient = new AleoNetworkClient("https://vm.aleo.org/api");
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache = true;
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions
     * const programName = "hello_hello.aleo";
     * const programManager = new ProgramManager("https://vm.aleo.org/api", keyProvider, recordProvider);
     * const keySearchParams = { "cacheKey": "hello_hello:hello" };
     * const tx_id = await programManager.execute(programName, "hello_hello", 0.020, ["5u32", "5u32"], undefined, undefined, undefined, keySearchParams);
     * const transaction = await programManager.networkClient.getTransaction(tx_id);
     */
    ProgramManager.prototype.execute = function (programName, functionName, fee, inputs, recordSearchParams, keySearchParams, feeRecord, provingKey, verifyingKey, privateKey) {
        return __awaiter(this, void 0, void 0, function () {
            var program, e_4, executionPrivateKey, e_5, feeKeys, e_6, feeProvingKey, feeVerifyingKey, e_7, imports, e_8, tx;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.networkClient.getProgram(programName)];
                    case 1:
                        program = (_b.sent());
                        return [3 /*break*/, 3];
                    case 2:
                        e_4 = _b.sent();
                        throw logAndThrow("Error finding ".concat(programName, ". Network response: '").concat(e_4, "'. Please ensure you're connected to a valid Aleo network the program is deployed to the network."));
                    case 3:
                        // Convert the fee to microcredits
                        fee = Math.floor(fee * 1000000);
                        executionPrivateKey = privateKey;
                        if (typeof privateKey === "undefined" && typeof this.account !== "undefined") {
                            executionPrivateKey = this.account.privateKey();
                        }
                        else {
                            throw ("No private key provided and no private key set in the ProgramManager");
                        }
                        _b.label = 4;
                    case 4:
                        _b.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, this.getCreditsRecord(fee, [], feeRecord, recordSearchParams)];
                    case 5:
                        feeRecord = (_b.sent());
                        return [3 /*break*/, 7];
                    case 6:
                        e_5 = _b.sent();
                        throw logAndThrow("Error finding fee record. Record finder response: '".concat(e_5, "'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists."));
                    case 7:
                        _b.trys.push([7, 9, , 10]);
                        return [4 /*yield*/, this.keyProvider.feeKeys()];
                    case 8:
                        feeKeys = (_b.sent());
                        return [3 /*break*/, 10];
                    case 9:
                        e_6 = _b.sent();
                        throw logAndThrow("Error finding fee keys. Key finder response: '".concat(e_6, "'. Please ensure your key provider is configured correctly."));
                    case 10:
                        feeProvingKey = feeKeys[0], feeVerifyingKey = feeKeys[1];
                        if (!(!provingKey || !verifyingKey)) return [3 /*break*/, 14];
                        _b.label = 11;
                    case 11:
                        _b.trys.push([11, 13, , 14]);
                        return [4 /*yield*/, this.keyProvider.functionKeys(keySearchParams)];
                    case 12:
                        _a = (_b.sent()), provingKey = _a[0], verifyingKey = _a[1];
                        return [3 /*break*/, 14];
                    case 13:
                        e_7 = _b.sent();
                        console.log("Function keys not found. Key finder response: '".concat(e_7, "'. The function keys will be synthesized"));
                        return [3 /*break*/, 14];
                    case 14:
                        _b.trys.push([14, 16, , 17]);
                        return [4 /*yield*/, this.networkClient.getProgramImports(programName)];
                    case 15:
                        imports = _b.sent();
                        return [3 /*break*/, 17];
                    case 16:
                        e_8 = _b.sent();
                        throw logAndThrow("Error finding program imports. Network response: '".concat(e_8, "'. Please ensure you're connected to a valid Aleo network and the program is deployed to the network."));
                    case 17: return [4 /*yield*/, this.buildExecutionTransaction(executionPrivateKey, program, functionName, inputs, fee, feeRecord, this.host, false, imports, provingKey, verifyingKey, feeProvingKey, feeVerifyingKey)];
                    case 18:
                        tx = _b.sent();
                        return [4 /*yield*/, this.networkClient.submitTransaction(tx)];
                    case 19: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    /**
     * Execute an Aleo program in offline mode
     *
     * @param {string} program Program source code containing the function to be executed
     * @param {string} function_name Function name to execute
     * @param {string[]} inputs Inputs to the function
     * @param {string[] | undefined} imports Optional imports to the program
     * @param {KeySearchParams | undefined} keySearchParams Optional parameters for finding the matching proving &
     * verifying keys for the function
     * @param {ProvingKey | undefined} provingKey Optional proving key to use for the transaction
     * @param {VerifyingKey | undefined} verifyingKey Optional verifying key to use for the transaction
     * @param {PrivateKey | undefined} privateKey Optional private key to use for the transaction
     * @returns {Promise<string | Error>}
     *
     * @example
     * const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
     * const programManager = new ProgramManager();
     * const executionResponse = await programManager.executeOffline(program, "hello_hello", ["5u32", "5u32"]);
     *
     * const result = executionResponse.getOutputs();
     * assert(result === ["10u32"]);
     */
    ProgramManager.prototype.executeOffline = function (program, function_name, inputs, imports, keySearchParams, provingKey, verifyingKey, privateKey) {
        return __awaiter(this, void 0, void 0, function () {
            var executionPrivateKey, e_9;
            var _a;
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
                        if (!(!provingKey || !verifyingKey)) return [3 /*break*/, 4];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.keyProvider.functionKeys(keySearchParams)];
                    case 2:
                        _a = (_b.sent()), provingKey = _a[0], verifyingKey = _a[1];
                        return [3 /*break*/, 4];
                    case 3:
                        e_9 = _b.sent();
                        console.log("Function keys not found. Key finder response: '".concat(e_9, "'. The function keys will be synthesized"));
                        return [3 /*break*/, 4];
                    case 4: 
                    // Run the program offline and return the result
                    return [2 /*return*/, this.executeFunctionOffline(executionPrivateKey, program, function_name, inputs, false, imports, provingKey, verifyingKey)];
                }
            });
        });
    };
    /**
     * Join two credits records into a single credits record
     *
     * @param {RecordPlaintext | string} recordOne First credits record to join
     * @param {RecordPlaintext | string} recordTwo Second credits record to join
     * @param {number} fee Fee in credits pay for the join transaction
     * @param {RecordSearchParams | undefined} recordSearchParams Optional parameters for finding the fee record for the join transaction
     * @param {RecordPlaintext | string | undefined} feeRecord Fee record to use for the join transaction
     * @param {PrivateKey | undefined} privateKey Private key to use for the join transaction
     * @returns {Promise<string | Error>}
     */
    ProgramManager.prototype.join = function (recordOne, recordTwo, fee, recordSearchParams, feeRecord, privateKey) {
        return __awaiter(this, void 0, void 0, function () {
            var executionPrivateKey, feeKeys, joinKeys, e_10, feeProvingKey, feeVerifyingKey, joinProvingKey, joinVerifyingKey, e_11, tx;
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
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.keyProvider.feeKeys()];
                    case 2:
                        feeKeys = (_a.sent());
                        return [4 /*yield*/, this.keyProvider.joinKeys()];
                    case 3:
                        joinKeys = (_a.sent());
                        return [3 /*break*/, 5];
                    case 4:
                        e_10 = _a.sent();
                        throw logAndThrow("Error finding fee keys. Key finder response: '".concat(e_10, "'. Please ensure your key provider is configured correctly."));
                    case 5:
                        feeProvingKey = feeKeys[0], feeVerifyingKey = feeKeys[1];
                        joinProvingKey = joinKeys[0], joinVerifyingKey = joinKeys[1];
                        _a.label = 6;
                    case 6:
                        _a.trys.push([6, 8, , 9]);
                        return [4 /*yield*/, this.getCreditsRecord(fee, [], feeRecord, recordSearchParams)];
                    case 7:
                        feeRecord = (_a.sent());
                        return [3 /*break*/, 9];
                    case 8:
                        e_11 = _a.sent();
                        throw logAndThrow("Error finding fee record. Record finder response: '".concat(e_11, "'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists."));
                    case 9:
                        // Validate the records provided are valid plaintext records
                        try {
                            recordOne = recordOne instanceof RecordPlaintext ? recordOne : RecordPlaintext.fromString(recordOne);
                            recordTwo = recordTwo instanceof RecordPlaintext ? recordTwo : RecordPlaintext.fromString(recordTwo);
                        }
                        catch (e) {
                            throw logAndThrow('Records provided are not valid. Please ensure they are valid plaintext records.');
                        }
                        return [4 /*yield*/, this.buildJoinTransaction(executionPrivateKey, recordOne, recordTwo, fee, feeRecord, this.host, false, joinProvingKey, joinVerifyingKey, feeProvingKey, feeVerifyingKey)];
                    case 10:
                        tx = _a.sent();
                        return [4 /*yield*/, this.networkClient.submitTransaction(tx)];
                    case 11: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Split credits into two new credits records
     *
     * @param {number} splitAmount Amount in microcredits to split from the original credits record
     * @param {RecordPlaintext | string} amountRecord Amount record to use for the split transaction
     * @param {PrivateKey | undefined} privateKey Optional private key to use for the split transaction
     * @returns {Promise<string | Error>}
     *
     * @example
     * // Create a new NetworkClient, KeyProvider, and RecordProvider
     * const networkClient = new AleoNetworkClient("https://vm.aleo.org/api");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions
     * const programName = "hello_hello.aleo";
     * const programManager = new ProgramManager("https://vm.aleo.org/api", keyProvider, recordProvider);
     * await programManager.initialize();
     * const record = "{  owner: aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4.private,  microcredits: 45000000u64.private,  _nonce: 4106205762862305308495708971985748592380064201230396559307556388725936304984group.public}"
     * const tx_id = await programManager.split(25000000, record);
     * const transaction = await programManager.networkClient.getTransaction(tx_id);
     */
    ProgramManager.prototype.split = function (splitAmount, amountRecord, privateKey) {
        return __awaiter(this, void 0, void 0, function () {
            var executionPrivateKey, splitKeys, e_12, splitProvingKey, splitVerifyingKey, tx;
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
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.keyProvider.splitKeys()];
                    case 2:
                        splitKeys = (_a.sent());
                        return [3 /*break*/, 4];
                    case 3:
                        e_12 = _a.sent();
                        throw logAndThrow("Error finding fee keys. Key finder response: '".concat(e_12, "'. Please ensure your key provider is configured correctly."));
                    case 4:
                        splitProvingKey = splitKeys[0], splitVerifyingKey = splitKeys[1];
                        // Validate the record to be split
                        try {
                            amountRecord = amountRecord instanceof RecordPlaintext ? amountRecord : RecordPlaintext.fromString(amountRecord);
                        }
                        catch (e) {
                            throw logAndThrow("Record provided is not valid. Please ensure it is a valid plaintext record.");
                        }
                        return [4 /*yield*/, this.buildSplitTransaction(executionPrivateKey, splitAmount, amountRecord, this.host, false, splitProvingKey, splitVerifyingKey)];
                    case 5:
                        tx = _a.sent();
                        return [4 /*yield*/, this.networkClient.submitTransaction(tx)];
                    case 6: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Transfer credits to another account
     *
     * @param {number} amount The amount of credits to transfer
     * @param {string} recipient The recipient of the transfer
     * @param {string} transferType The type of transfer to perform - options: 'private', 'privateToPublic', 'public', 'publicToPrivate'
     * @param {number} fee The fee to pay for the transfer
     * @param {RecordSearchParams | undefined} recordSearchParams Optional parameters for finding the fee record for the join transaction
     * @param {RecordPlaintext | string} amountRecord Optional amount record to use for the transfer
     * @param {RecordPlaintext | string} feeRecord Optional fee record to use for the transfer
     * @param {PrivateKey | undefined} privateKey Optional private key to use for the transfer transaction
     * @returns {Promise<string | Error>} The transaction id of the transfer transaction
     *
     * @example
     * // Create a new NetworkClient, KeyProvider, and RecordProvider
     * const networkClient = new AleoNetworkClient("https://vm.aleo.org/api");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions
     * const programName = "hello_hello.aleo";
     * const programManager = new ProgramManager("https://vm.aleo.org/api", keyProvider, recordProvider);
     * await programManager.initialize();
     * const tx_id = await programManager.transfer(1, "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "private", 0.2)
     * const transaction = await programManager.networkClient.getTransaction(tx_id);
     */
    ProgramManager.prototype.transfer = function (amount, recipient, transferType, fee, recordSearchParams, amountRecord, feeRecord, privateKey) {
        return __awaiter(this, void 0, void 0, function () {
            var executionPrivateKey, feeKeys, transferKeys, e_13, feeProvingKey, feeVerifyingKey, transferProvingKey, transferVerifyingKey, nonces, e_14, tx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Validate the transfer type
                        transferType = validateTransferType(transferType);
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
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.keyProvider.feeKeys()];
                    case 2:
                        feeKeys = (_a.sent());
                        return [4 /*yield*/, this.keyProvider.transferKeys(transferType)];
                    case 3:
                        transferKeys = (_a.sent());
                        return [3 /*break*/, 5];
                    case 4:
                        e_13 = _a.sent();
                        throw logAndThrow("Error finding fee keys. Key finder response: '".concat(e_13, "'. Please ensure your key provider is configured correctly."));
                    case 5:
                        feeProvingKey = feeKeys[0], feeVerifyingKey = feeKeys[1];
                        transferProvingKey = transferKeys[0], transferVerifyingKey = transferKeys[1];
                        _a.label = 6;
                    case 6:
                        _a.trys.push([6, 11, , 12]);
                        nonces = [];
                        if (!requiresAmountRecord(transferType)) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.getCreditsRecord(fee, [], amountRecord, recordSearchParams)];
                    case 7:
                        // If the transfer type is private and requires an amount record, get it from the record provider
                        amountRecord = (_a.sent());
                        nonces.push(amountRecord.nonce());
                        return [3 /*break*/, 9];
                    case 8:
                        amountRecord = undefined;
                        _a.label = 9;
                    case 9: return [4 /*yield*/, this.getCreditsRecord(fee, nonces, feeRecord, recordSearchParams)];
                    case 10:
                        feeRecord = (_a.sent());
                        return [3 /*break*/, 12];
                    case 11:
                        e_14 = _a.sent();
                        throw logAndThrow("Error finding fee record. Record finder response: '".concat(e_14, "'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists."));
                    case 12: return [4 /*yield*/, this.buildTransferTransaction(executionPrivateKey, amount, recipient, transferType, amountRecord, fee, feeRecord, this.host, false, transferProvingKey, transferVerifyingKey, feeProvingKey, feeVerifyingKey)];
                    case 13:
                        tx = _a.sent();
                        return [4 /*yield*/, this.networkClient.submitTransaction(tx)];
                    case 14: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Create a program object from a program's source code
     *
     * @param {string} program Program source code
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
    /**
     * Verify a program is valid
     *
     * @param {string} program The program source code
     */
    ProgramManager.prototype.verifyProgram = function (program) {
        try {
            Program.fromString(program);
            return true;
        }
        catch (e) {
            return false;
        }
    };
    // Internal utility function for getting a credits.aleo record
    ProgramManager.prototype.getCreditsRecord = function (amount, nonces, record, params) {
        return __awaiter(this, void 0, void 0, function () {
            var e_15, recordProvider, e_16;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 1, , 6]);
                        return [2 /*return*/, record instanceof RecordPlaintext ? record : RecordPlaintext.fromString(record)];
                    case 1:
                        e_15 = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        recordProvider = this.recordProvider;
                        return [4 /*yield*/, recordProvider.findCreditsRecord(amount, true, nonces, params)];
                    case 3: return [2 /*return*/, (_a.sent())];
                    case 4:
                        e_16 = _a.sent();
                        throw logAndThrow("Error finding fee record. Record finder response: '".concat(e_16, "'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists."));
                    case 5: return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return ProgramManager;
}(WasmProgramManager));
function requiresAmountRecord(transferType) {
    switch (transferType) {
        case "transfer_private" || "private" || "transferPrivate":
            return true;
        case "transfer_private_to_public" || "privateToPublic" || "transferPrivateToPublic":
            return true;
        default:
            return false;
    }
}
function validateTransferType(transferType) {
    switch (transferType) {
        case "transfer_private" || "private" || "transferPrivate" || "transfer_private_to_public" || "privateToPublic"
            || "transferPrivateToPublic" || "transfer_public" || "public" || "transferPublic" || "transfer_public_to_private"
            || "publicToPrivate" || "transferPublicToPrivate":
            return transferType;
        default:
            throw logAndThrow("Invalid transfer type '".concat(transferType, "'. Valid transfer types are 'private', 'privateToPublic', 'public', and 'publicToPrivate'."));
    }
}
export { ProgramManager };
//# sourceMappingURL=program-manager.js.map