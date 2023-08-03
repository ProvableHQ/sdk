import { __awaiter, __generator } from "tslib";
import { ProvingKey, VerifyingKey, CREDITS_PROGRAM_KEYS, KEY_STORE } from ".";
import axios from "axios";
/**
 * AleoKeyProvider class. Implements the KeyProvider interface. Enables the retrieval of Aleo program proving and
 * verifying keys stored as bytes as well as proving and verifying keys for the credits.aleo program over http from
 * official Aleo sources.
 */
var AleoKeyProvider = /** @class */ (function () {
    function AleoKeyProvider() {
        this.keyUris = KEY_STORE;
        this.cache = new Map();
        this.cacheOption = false;
    }
    AleoKeyProvider.prototype.fetchBytes = function (url) {
        if (url === void 0) { url = "/"; }
        return __awaiter(this, void 0, void 0, function () {
            var response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios.get("https://testnet3.parameters.aleo.org/" + url, { responseType: 'arraybuffer' })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, new Uint8Array(response.data)];
                    case 2:
                        error_1 = _a.sent();
                        throw new Error("Error fetching data.");
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Use local memory to store keys
     *
     * @param useCache whether to store keys in local memory
     */
    AleoKeyProvider.prototype.useCache = function (useCache) {
        this.cacheOption = useCache;
    };
    /**
     * Clear the key cache
     */
    AleoKeyProvider.prototype.clearCache = function () {
        this.cache.clear();
    };
    /// Fetch program keys from their stored byte representation and return the corresponding proving and verifying key
    /// objects
    AleoKeyProvider.prototype.fetchFunctionKeys = function (proverUrl, verifierUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var provingKey, _a, _b, verifyingKey, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _b = (_a = ProvingKey).fromBytes;
                        return [4 /*yield*/, this.fetchBytes(proverUrl)];
                    case 1:
                        provingKey = _b.apply(_a, [_e.sent()]);
                        _d = (_c = VerifyingKey).fromBytes;
                        return [4 /*yield*/, this.fetchBytes(verifierUrl)];
                    case 2:
                        verifyingKey = _d.apply(_c, [_e.sent()]);
                        return [2 /*return*/, [provingKey, verifyingKey]];
                }
            });
        });
    };
    /**
     * Returns the proving and verifying keys for a specified function in an Aleo Program given the url of the proving
     * and verifying keys
     *
     * @param {string} url of the proving key
     * @param {string} url of the verifying key
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the specified program
     *
     * @example
     * // Create a new AleoKeyProvider object
     * const networkClient = new AleoNetworkClient("https://vm.aleo.org/api");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
     * const programManager = new ProgramManager(networkClient, keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     *
     * // Keys can also be fetched manually
     * const [transferPrivateProvingKey, transferPrivateVerifyingKey] = await keyProvider.functionKeys("https://testnet3.parameters.aleo.org/transfer_private.prover.2a9a6f2", "https://testnet3.parameters.aleo.org/transfer_private.verifier.3a59762");
     */
    AleoKeyProvider.prototype.functionKeys = function (proverUrl, verifierUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, value, keys, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        if (!this.cacheOption) return [3 /*break*/, 4];
                        cacheKey = proverUrl + verifierUrl;
                        value = this.cache.get(cacheKey);
                        if (!(typeof value !== "undefined")) return [3 /*break*/, 1];
                        return [2 /*return*/, value];
                    case 1: return [4 /*yield*/, this.fetchFunctionKeys(proverUrl, verifierUrl)];
                    case 2:
                        keys = _a.sent();
                        if (!(keys instanceof Error)) {
                            this.cache.set(cacheKey, keys);
                        }
                        else {
                            throw "Error fetching keys";
                        }
                        return [2 /*return*/, keys];
                    case 3: return [3 /*break*/, 6];
                    case 4: return [4 /*yield*/, this.fetchFunctionKeys(proverUrl, verifierUrl)];
                    case 5: 
                    // If cache is disabled, fetch the keys and return them
                    return [2 /*return*/, _a.sent()];
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        error_2 = _a.sent();
                        throw new Error("Error fetching fee proving and verifying keys from ".concat(proverUrl, " and ").concat(verifierUrl, "."));
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns the proving and verifying keys for the transfer functions in the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the transfer functions
     *
     * @example
     * // Create a new AleoKeyProvider
     * const networkClient = new AleoNetworkClient("https://vm.aleo.org/api");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
     * const programManager = new ProgramManager(networkClient, keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     *
     * // Keys can also be fetched manually
     * const [transferPublicProvingKey, transferPublicVerifyingKey] = await keyProvider.transferKeys("public");
     */
    AleoKeyProvider.prototype.transferKeys = function (visibility) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = visibility;
                        switch (_a) {
                            case "private" || "transfer_private" || "Private" || "transferPrivate": return [3 /*break*/, 1];
                            case "public" || "transfer_public" || "Public" || "transferPublic": return [3 /*break*/, 3];
                            case "private_to_public" || "transfer_private_to_public" || "privateToPublic" || "transferPrivateToPublic": return [3 /*break*/, 5];
                            case "public_to_private" || "transfer_public_to_private" || "publicToPrivate" || "transferPublicToPrivate": return [3 /*break*/, 7];
                        }
                        return [3 /*break*/, 9];
                    case 1: return [4 /*yield*/, this.functionKeys(CREDITS_PROGRAM_KEYS.transfer_private.prover, CREDITS_PROGRAM_KEYS.transfer_private.verifier)];
                    case 2: return [2 /*return*/, _b.sent()];
                    case 3: return [4 /*yield*/, this.functionKeys(CREDITS_PROGRAM_KEYS.transfer_public.prover, CREDITS_PROGRAM_KEYS.transfer_public.verifier)];
                    case 4: return [2 /*return*/, _b.sent()];
                    case 5: return [4 /*yield*/, this.functionKeys(CREDITS_PROGRAM_KEYS.transfer_private_to_public.prover, CREDITS_PROGRAM_KEYS.transfer_private_to_public.verifier)];
                    case 6: return [2 /*return*/, _b.sent()];
                    case 7: return [4 /*yield*/, this.functionKeys(CREDITS_PROGRAM_KEYS.transfer_public_to_private.prover, CREDITS_PROGRAM_KEYS.transfer_public_to_private.verifier)];
                    case 8: return [2 /*return*/, _b.sent()];
                    case 9: throw new Error("Invalid visibility type");
                }
            });
        });
    };
    /**
     * Returns the proving and verifying keys for the join function in the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the join function
     */
    AleoKeyProvider.prototype.joinKeys = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.functionKeys(CREDITS_PROGRAM_KEYS.join.prover, CREDITS_PROGRAM_KEYS.join.verifier)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns the proving and verifying keys for the split function in the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the split function
     * */
    AleoKeyProvider.prototype.splitKeys = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.functionKeys(CREDITS_PROGRAM_KEYS.split.prover, CREDITS_PROGRAM_KEYS.split.verifier)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns the proving and verifying keys for the fee function in the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the fee function
     */
    AleoKeyProvider.prototype.feeKeys = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.functionKeys(CREDITS_PROGRAM_KEYS.fee.prover, CREDITS_PROGRAM_KEYS.fee.verifier)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return AleoKeyProvider;
}());
export { AleoKeyProvider };
//# sourceMappingURL=key-provider.js.map