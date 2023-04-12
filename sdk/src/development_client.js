import { __asyncGenerator, __asyncValues, __await, __awaiter, __generator } from "tslib";
import axios from 'axios';
var config = {
    headers: {
        "Content-type": "application/json; charset=UTF-8",
        "Referrer-Policy": "no-referrer"
    }
};
function readChunks(reader) {
    return __asyncGenerator(this, arguments, function readChunks_1() {
        var _a, done, value;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, , 6, 7]);
                    _b.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 5];
                    return [4 /*yield*/, __await(reader.read())];
                case 2:
                    _a = _b.sent(), done = _a.done, value = _a.value;
                    if (done) {
                        return [3 /*break*/, 5];
                    }
                    return [4 /*yield*/, __await(value)];
                case 3: return [4 /*yield*/, _b.sent()];
                case 4:
                    _b.sent();
                    return [3 /*break*/, 1];
                case 5: return [3 /*break*/, 7];
                case 6:
                    reader.releaseLock();
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    });
}
var SSEconfig = {
    headers: {
        "Content-type": "application/json; charset=UTF-8",
        "Referrer-Policy": "no-referrer"
    },
    responseType: 'stream'
};
var DevelopmentClient = /** @class */ (function () {
    /**
     * Creates a new DevelopmentClient to interact with an Aleo Development Server.
     *
     * @param {string} baseURL The URL of the Aleo Development Server
     */
    function DevelopmentClient(baseURL) {
        this.baseURL = baseURL;
    }
    DevelopmentClient.prototype.sendSSERequest = function (path, request) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                console.debug("Sending SSE Request");
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var response, reader, decoder, eventType, _a, _b, _c, chunk, decodedChunk, lines, _i, lines_1, line, data, e_1_1, error_1;
                        var _d, e_1, _e, _f;
                        return __generator(this, function (_g) {
                            switch (_g.label) {
                                case 0:
                                    _g.trys.push([0, 14, , 15]);
                                    return [4 /*yield*/, fetch("".concat(this.baseURL, "/testnet3").concat(path), {
                                            method: 'POST',
                                            headers: {
                                                "Content-type": "application/json; charset=UTF-8",
                                                "Referrer-Policy": "no-referrer"
                                            },
                                            body: JSON.stringify(request)
                                        })];
                                case 1:
                                    response = _g.sent();
                                    if (!response.ok) {
                                        reject(new Error("Request failed with status ".concat(response.status, ": ").concat(response.statusText)));
                                        return [2 /*return*/];
                                    }
                                    if (!response.body) {
                                        reject(new Error('No response body'));
                                        return [2 /*return*/];
                                    }
                                    reader = response.body.getReader();
                                    decoder = new TextDecoder();
                                    eventType = null;
                                    _g.label = 2;
                                case 2:
                                    _g.trys.push([2, 7, 8, 13]);
                                    _a = true, _b = __asyncValues(readChunks(reader));
                                    _g.label = 3;
                                case 3: return [4 /*yield*/, _b.next()];
                                case 4:
                                    if (!(_c = _g.sent(), _d = _c.done, !_d)) return [3 /*break*/, 6];
                                    _f = _c.value;
                                    _a = false;
                                    try {
                                        chunk = _f;
                                        decodedChunk = decoder.decode(chunk, { stream: true });
                                        lines = decodedChunk.split('\n');
                                        for (_i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                                            line = lines_1[_i];
                                            console.debug("Line:", line);
                                            if (line.startsWith('event:')) {
                                                eventType = line.slice(6);
                                                console.debug("Event Type:", eventType);
                                            }
                                            else if (line.startsWith('data:') && eventType) {
                                                data = line.slice(6);
                                                if (eventType === 'success') {
                                                    resolve(data);
                                                    return [2 /*return*/];
                                                }
                                                else if (eventType === 'error' || eventType === 'timeout') {
                                                    console.debug("Error encountered");
                                                    reject(new Error(data));
                                                    return [2 /*return*/];
                                                }
                                                eventType = null;
                                            }
                                            if (eventType === 'error' || eventType === 'timeout') {
                                                console.debug("Error encountered");
                                                reject(new Error(eventType));
                                                return [2 /*return*/];
                                            }
                                        }
                                    }
                                    finally {
                                        _a = true;
                                    }
                                    _g.label = 5;
                                case 5: return [3 /*break*/, 3];
                                case 6: return [3 /*break*/, 13];
                                case 7:
                                    e_1_1 = _g.sent();
                                    e_1 = { error: e_1_1 };
                                    return [3 /*break*/, 13];
                                case 8:
                                    _g.trys.push([8, , 11, 12]);
                                    if (!(!_a && !_d && (_e = _b["return"]))) return [3 /*break*/, 10];
                                    return [4 /*yield*/, _e.call(_b)];
                                case 9:
                                    _g.sent();
                                    _g.label = 10;
                                case 10: return [3 /*break*/, 12];
                                case 11:
                                    if (e_1) throw e_1.error;
                                    return [7 /*endfinally*/];
                                case 12: return [7 /*endfinally*/];
                                case 13: return [3 /*break*/, 15];
                                case 14:
                                    error_1 = _g.sent();
                                    console.debug("Error: ", error_1);
                                    reject(error_1);
                                    return [3 /*break*/, 15];
                                case 15: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    DevelopmentClient.prototype.sendRequest = function (path, request) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, axios.post("".concat(this.baseURL, "/testnet3").concat(path), request, config)];
                    case 1:
                        response = _a.sent();
                        if (!(response.statusText = "200")) {
                            throw new Error("Error sending request: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.data];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Deploys a program on the Aleo Network via an Aleo development server.
     * It requires an Aleo Development Server to be running remotely or locally.
     * If one is not running, this function will throw an error.
     *
     * Information on how to run an Aleo Development Server can be found here:
     * https://github.com/AleoHQ/aleo/rust/develop/README.md
     * @param {string} program Text representation of the program to be deployed
     * @param {number} fee Fee to be paid for the program deployment (REQUIRED)
     * @param {string | undefined} privateKey Optional private key of the user who is deploying the program
     * @param {string | undefined} password If the development server is started with an encrypted private key, the password is required
     * @param {string | undefined} feeRecord Optional record in text format to be used for the fee. If not provided, the server will search the network for a suitable record to pay the fee.
     * @returns {string | Error} The transaction_id of the deployment transaction if successful
     *
     * @example
     * const Program = 'program yourprogram.aleo;\n\nfunction main:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n';
     * const client = new DevelopmentClient("http://0.0.0.0:4040");
     * const transaction_id = await client.deployProgram(Program, 6000000, privateKeyString);
     */
    DevelopmentClient.prototype.deployProgram = function (program, fee, privateKey, password, feeRecord) {
        return __awaiter(this, void 0, void 0, function () {
            var request;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {
                            program: program,
                            private_key: privateKey,
                            password: password,
                            fee: fee,
                            fee_record: feeRecord
                        };
                        return [4 /*yield*/, this.sendSSERequest('/deploy', request)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Executes a program on the Aleo Network via an Aleo development server.
     * It requires an Aleo Development Server to be running remotely or locally.
     * If one is not running, this function will throw an error.
     *
     * Information on how to run an Aleo Development Server can be found here:
     * https://github.com/AleoHQ/aleo/rust/develop/README.md
     * @param {string} programId The program_id of the program to be executed (e.g. hello.aleo)
     * @param {string} programFunction The function to execute within the program (e.g. main)
     * @param {number} fee Optional Fee to be paid for the execution transaction, specify 0 for no fee
     * @param {string[]} inputs Array of inputs to be passed to the program
     * @param {string | undefined} privateKey Optional private key of the user who is executing the program
     * @param {string | undefined} password If the development server is started with an encrypted private key, the password is required
     * @param {string | undefined} feeRecord Optional record in text format to be used for the fee. If not provided, the server will search the network for a suitable record to pay the fee.
     * @returns {string | Error} The transaction_id of the execution transaction if successful
     *
     * @example
     * const privateKey = "your private key";
     * const client = new DevelopmentClient("http://0.0.0.0:4040");
     * const transaction_id = await client.executeProgram("hello.aleo", "main", 0, ["5u32", "5u32"], privateKeyString);
     */
    DevelopmentClient.prototype.executeProgram = function (programId, programFunction, fee, inputs, privateKey, password, feeRecord) {
        return __awaiter(this, void 0, void 0, function () {
            var request;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {
                            program_id: programId,
                            program_function: programFunction,
                            inputs: inputs,
                            private_key: privateKey,
                            password: password,
                            fee: fee,
                            fee_record: feeRecord
                        };
                        return [4 /*yield*/, this.sendSSERequest('/execute', request)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Sends an amount in credits to a specified recipient on the Aleo Network
     * via an Aleo development server. It requires an Aleo Development Server
     * to be running remotely or locally. If one is not running, this function
     * will throw an error.
     *
     * Information on how to run an Aleo Development Server can be found here:
     * https://github.com/AleoHQ/aleo/rust/develop/README.md
     * @param {string} amount The amount of credits to be sent (e.g. 1.5)
     * @param {number} fee Optional Fee to be paid for the transfer, specify 0 for no fee
     * @param {string} recipient The recipient of the transfer
     * @param {string | undefined} privateKey Optional private key of the user who is sending the transfer
     * @param {string | undefined} password If the development server is started with an encrypted private key, the password is required
     * @param {string | undefined} feeRecord Optional record in text format to be used for the fee. If not provided, the server will search the network for a suitable record to pay the fee.
     * @param {string | undefined} amountRecord Optional record in text format to be used to fund the transfer. If not provided, the server will search the network for a suitable record to fund the amount.
     * @returns {string | Error} The transaction_id of the execution transaction if successful
     *
     * @example
     * const privateKey = "your private key";
     * const recipient = "recipient's address";
     * const client = new DevelopmentClient("http://0.0.0.0:4040");
     * const transaction_id = await client.transfer(1.5, 0, recipient, privateKey);
     */
    DevelopmentClient.prototype.transfer = function (amount, fee, recipient, privateKey, password, feeRecord, amountRecord) {
        return __awaiter(this, void 0, void 0, function () {
            var request;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {
                            amount: amount * 1000000,
                            fee: fee,
                            recipient: recipient,
                            private_key: privateKey,
                            password: password,
                            fee_record: feeRecord,
                            amount_record: amountRecord
                        };
                        return [4 /*yield*/, this.sendSSERequest('/transfer', request)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return DevelopmentClient;
}());
export { DevelopmentClient };
export default DevelopmentClient;
//# sourceMappingURL=development_client.js.map