import { __awaiter, __generator } from "tslib";
import fetch from "unfetch";
/**
 * Connection management class that encapsulates REST calls to publicly exposed endpoints of Aleo nodes.
 * The methods provided in this class provide information on the Aleo Blockchain
 *
 * @param {string} host
 * @example
 * // Connection to a local node
 * let local_connection = new NodeConnection("localhost:4130");
 *
 * // Connection to a public beacon node
 * let public_connection = new NodeConnection("vm.aleo.org/api");
 */
var NodeConnection = /** @class */ (function () {
    function NodeConnection(host) {
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
    NodeConnection.prototype.setAccount = function (account) {
        this.account = account;
    };
    /**
     * Return the Aleo account used in the node connection
     *
     * @example
     * let account = connection.getAccount();
     */
    NodeConnection.prototype.getAccount = function () {
        return this.account;
    };
    NodeConnection.prototype.fetchData = function (url, method, body, headers) {
        if (url === void 0) { url = "/"; }
        if (method === void 0) { method = "GET"; }
        if (body === void 0) { body = ""; }
        if (headers === void 0) { headers = { "Content-Type": "application/json" }; }
        return __awaiter(this, void 0, void 0, function () {
            var response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch(this.host + url, {
                            method: method,
                            body: JSON.stringify(body),
                            headers: headers
                        })];
                    case 1:
                        response = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        if (!response.ok) {
                            throw response;
                        }
                        return [4 /*yield*/, response.json()];
                    case 3: return [2 /*return*/, (_a.sent())];
                    case 4:
                        error_1 = _a.sent();
                        throw error_1;
                    case 5: return [2 /*return*/];
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
    NodeConnection.prototype.getLatestHeight = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/latest/height")];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_2 = _a.sent();
                        console.log("Error - response: ", error_2);
                        throw new Error("Error fetching latest height.");
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
    NodeConnection.prototype.getLatestHash = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/latest/hash")];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_3 = _a.sent();
                        console.log("Error - response: ", error_3);
                        throw new Error("Error fetching latest hash.");
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
    NodeConnection.prototype.getLatestBlock = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/latest/block")];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_4 = _a.sent();
                        console.log("Error - response: ", error_4);
                        throw new Error("Error fetching latest block.");
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
    NodeConnection.prototype.getTransactions = function (height) {
        return __awaiter(this, void 0, void 0, function () {
            var error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/transactions/" + height)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_5 = _a.sent();
                        console.log("Error - response: ", error_5);
                        throw new Error("Error fetching transactions.");
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
    NodeConnection.prototype.getTransaction = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/transaction/" + id)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_6 = _a.sent();
                        console.log("Error - response: ", error_6);
                        throw new Error("Error fetching transaction.");
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
    NodeConnection.prototype.getBlock = function (height) {
        return __awaiter(this, void 0, void 0, function () {
            var error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchData("/block/" + height)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_7 = _a.sent();
                        console.log("Error - response: ", error_7);
                        throw new Error("Error fetching block.");
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return NodeConnection;
}());
export { NodeConnection };
export default NodeConnection;
//# sourceMappingURL=node_connection.js.map