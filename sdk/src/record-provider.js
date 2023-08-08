import { __awaiter, __generator } from "tslib";
import { logAndThrow } from ".";
/**
 * A record provider implementation that uses the official Aleo API to find records for usage in program execution and
 * deployment, wallet functionality, and other use cases.
 */
var NetworkRecordProvider = /** @class */ (function () {
    function NetworkRecordProvider(account, networkClient) {
        this.account = account;
        this.networkClient = networkClient;
    }
    /**
     * Set the account used to search for records
     *
     * @param {Account} account The account to use for searching for records
     */
    NetworkRecordProvider.prototype.setAccount = function (account) {
        this.account = account;
    };
    /**
     * Find a list of credit records with a given number of microcredits by via the official Aleo API
     *
     * @param {number[]} microcredits The number of microcredits to search for
     * @param {boolean} unspent Whether or not the record is unspent
     * @param {string[]} nonces Nonces of records already found so that they are not found again
     * @param {RecordSearchParams} searchParameters Additional parameters to search for
     * @returns {Promise<RecordPlaintext | Error>} The record if found, otherwise an error
     *
     * @example
     * // Create a new NetworkRecordProvider
     * const networkClient = new AleoNetworkClient("https://vm.aleo.org/api");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // The record provider can be used to find records with a given number of microcredits
     * const record = await recordProvider.findCreditsRecord(5000, true, []);
     *
     * // When a record is found but not yet used, it's nonce should be added to the nonces parameter so that it is not
     * // found again if a subsequent search is performed
     * const records = await recordProvider.findCreditsRecords(5000, true, [record.nonce()]);
     *
     * // When the program manager is initialized with the record provider it will be used to find automatically find
     * // fee records and amount records for value transfers so that they do not need to be specified manually
     * const programManager = new ProgramManager("https://vm.aleo.org/api", keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     *
     * */
    NetworkRecordProvider.prototype.findCreditsRecords = function (microcredits, unspent, nonces, searchParameters) {
        return __awaiter(this, void 0, void 0, function () {
            var startHeight, endHeight, end;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startHeight = 0;
                        endHeight = 0;
                        if (searchParameters) {
                            if ("startHeight" in searchParameters && typeof searchParameters["endHeight"] == "number") {
                                startHeight = searchParameters["startHeight"];
                            }
                            if ("endHeight" in searchParameters && typeof searchParameters["endHeight"] == "number") {
                                endHeight = searchParameters["endHeight"];
                            }
                        }
                        if (!(endHeight == 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.networkClient.getLatestHeight()];
                    case 1:
                        end = _a.sent();
                        if (end instanceof Error) {
                            throw logAndThrow("Unable to get current block height from the network");
                        }
                        endHeight = end;
                        _a.label = 2;
                    case 2:
                        // If the start height is greater than the end height, throw an error
                        if (startHeight >= endHeight) {
                            throw logAndThrow("Start height must be less than end height");
                        }
                        return [4 /*yield*/, this.networkClient.findUnspentRecords(startHeight, endHeight, this.account.privateKey(), microcredits, undefined, nonces)];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Find a credit record with a given number of microcredits by via the official Aleo API
     *
     * @param {number} microcredits The number of microcredits to search for
     * @param {boolean} unspent Whether or not the record is unspent
     * @param {string[]} nonces Nonces of records already found so that they are not found again
     * @param {RecordSearchParams} searchParameters Additional parameters to search for
     * @returns {Promise<RecordPlaintext | Error>} The record if found, otherwise an error
     *
     * @example
     * // Create a new NetworkRecordProvider
     * const networkClient = new AleoNetworkClient("https://vm.aleo.org/api");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // The record provider can be used to find records with a given number of microcredits
     * const record = await recordProvider.findCreditsRecord(5000, true, []);
     *
     * // When a record is found but not yet used, it's nonce should be added to the nonces parameter so that it is not
     * // found again if a subsequent search is performed
     * const records = await recordProvider.findCreditsRecords(5000, true, [record.nonce()]);
     *
     * // When the program manager is initialized with the record provider it will be used to find automatically find
     * // fee records and amount records for value transfers so that they do not need to be specified manually
     * const programManager = new ProgramManager("https://vm.aleo.org/api", keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     */
    NetworkRecordProvider.prototype.findCreditsRecord = function (microcredits, unspent, nonces, searchParameters) {
        return __awaiter(this, void 0, void 0, function () {
            var records;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.findCreditsRecords([microcredits], unspent, nonces, searchParameters)];
                    case 1:
                        records = _a.sent();
                        if (!(records instanceof Error) && records.length > 0) {
                            return [2 /*return*/, records[0]];
                        }
                        console.error("Record not found with error:", records);
                        return [2 /*return*/, new Error("Record not found")];
                }
            });
        });
    };
    /**
     * Find an arbitrary record. WARNING: This function is not implemented yet and will throw an error.
     */
    NetworkRecordProvider.prototype.findRecord = function (unspent, nonces, searchParameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("Method not implemented.");
            });
        });
    };
    /**
     * Find multiple arbitrary records. WARNING: This function is not implemented yet and will throw an error.
     */
    NetworkRecordProvider.prototype.findRecords = function (unspent, nonces, searchParameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("Method not implemented.");
            });
        });
    };
    return NetworkRecordProvider;
}());
/**
 * BlockHeightSearch is a RecordSearchParams implementation that allows for searching for records within a given
 * block height range.
 *
 * @example
 * // Create a new BlockHeightSearch
 * const params = new BlockHeightSearch(89995, 99995);
 *
 * // Create a new NetworkRecordProvider
 * const networkClient = new AleoNetworkClient("https://vm.aleo.org/api");
 * const keyProvider = new AleoKeyProvider();
 * const recordProvider = new NetworkRecordProvider(account, networkClient);
 *
 * // The record provider can be used to find records with a given number of microcredits and the block height search
 * // can be used to find records within a given block height range
 * const record = await recordProvider.findCreditsRecord(5000, true, [], params);
 *
 */
var BlockHeightSearch = /** @class */ (function () {
    function BlockHeightSearch(startHeight, endHeight) {
        this.startHeight = startHeight;
        this.endHeight = endHeight;
    }
    return BlockHeightSearch;
}());
export { BlockHeightSearch, NetworkRecordProvider };
//# sourceMappingURL=record-provider.js.map