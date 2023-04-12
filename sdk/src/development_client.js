import { __awaiter, __generator } from "tslib";
import axios from 'axios';
var config = {
    headers: {
        "Content-type": "application/json; charset=UTF-8",
        "Referrer-Policy": "no-referrer"
    }
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
                        return [4 /*yield*/, this.sendRequest('/deploy', request)];
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
                        return [4 /*yield*/, this.sendRequest('/execute', request)];
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
                        return [4 /*yield*/, this.sendRequest('/transfer', request)];
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