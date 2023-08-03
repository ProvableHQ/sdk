import { __awaiter, __generator } from "tslib";
var NetworkRecordProvider = /** @class */ (function () {
    function NetworkRecordProvider(account, networkClient) {
        this.account = account;
        this.networkClient = networkClient;
    }
    /**
     * Set the account used to search for records
     *
     * @param account {Account} The account to use for searching for records
     */
    NetworkRecordProvider.prototype.setAccount = function (account) {
        this.account = account;
    };
    /**
     * Find a list of credit records with a given number of microcredits by via the official Aleo API
     *
     * @param microcredits {number} The number of microcredits to search for
     * @param unspent {boolean} Whether or not the record is unspent
     * @param nonces {string[]} Nonces of records already found so they are not found again
     * @param searchParameters {RecordSearchParams} Additional parameters to search for
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
     * // When a record is found but not yet used, it's nonce should be added to the nonces array so that it is not
     * // found again if a subsequent search is performed
     * const records = await recordProvider.findCreditsRecord(5000, true, [record.nonce()]);
     *
     * // When the program manager is initialized with the record provider it will be used to find automatically find
     * // fee records and amount records for value transfers so they do not need to be specified manually
     * const programManager = new ProgramManager(networkClient, keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     *
     * */
    NetworkRecordProvider.prototype.findCreditsRecords = function (creditAmounts, unspent, nonces, searchParameters) {
        return __awaiter(this, void 0, void 0, function () {
            var startHeight, endHeight, end;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startHeight = 0;
                        endHeight = 0;
                        if (!searchParameters) return [3 /*break*/, 3];
                        if (searchParameters["startHeight"] && typeof searchParameters["endHeight"] == "number") {
                            startHeight = searchParameters["startHeight"];
                        }
                        if (!(searchParameters["endHeight"] && typeof searchParameters["endHeight"] == "number")) return [3 /*break*/, 1];
                        endHeight = searchParameters["endHeight"];
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.networkClient.getLatestHeight()];
                    case 2:
                        end = _a.sent();
                        if (end instanceof Error) {
                            console.error("Error getting latest height", end);
                            throw "Unable to get current block height";
                        }
                        endHeight = end;
                        _a.label = 3;
                    case 3: return [4 /*yield*/, this.networkClient.findUnspentRecords(startHeight, endHeight, this.account.privateKey().toString(), creditAmounts, undefined, nonces)];
                    case 4: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Find a credit record with a given number of microcredits by via the official Aleo API
     *
     * @param microcredits {number} The number of microcredits to search for
     * @param unspent {boolean} Whether or not the record is unspent
     * @param nonces {string[]} Nonces of records already found so they are not found again
     * @param searchParameters {RecordSearchParams} Additional parameters to search for
     * @returns {Promise<RecordPlaintext | Error>} The record if found, otherwise an error
     */
    NetworkRecordProvider.prototype.findCreditsRecord = function (creditAmount, unspent, nonces, searchParameters) {
        return __awaiter(this, void 0, void 0, function () {
            var records;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.findCreditsRecords([creditAmount], unspent, nonces, searchParameters)];
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