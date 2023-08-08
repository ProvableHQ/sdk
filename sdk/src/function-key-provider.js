import { __awaiter, __generator } from "tslib";
import { ProvingKey, VerifyingKey, CREDITS_PROGRAM_KEYS, KEY_STORE } from ".";
import axios from 'axios';
/**
 * AleoKeyProviderParams search parameter for the AleoKeyProvider. It allows for the specification of a proverUri and
 * verifierUri to fetch keys via HTTP from a remote resource as well as a unique cacheKey to store the keys in memory.
 */
var AleoKeyProviderParams = /** @class */ (function () {
    /**
     * Create a new AleoKeyProviderParams object which implements the KeySearchParams interface. Users can optionally
     * specify a url for the proverUri & verifierUri to fetch keys via HTTP from a remote resource as well as a unique
     * cacheKey to store the keys in memory for future use. If no proverUri or verifierUri is specified, a cachekey must
     * be provided.
     *
     * @param { proverUri?: string, verifierUri?: string, cacheKey?: string } params - Optional search parameters
     */
    function AleoKeyProviderParams(params) {
        this.proverUri = params.proverUri;
        this.verifierUri = params.verifierUri;
        this.cacheKey = params.cacheKey;
    }
    return AleoKeyProviderParams;
}());
/**
 * AleoKeyProvider class. Implements the KeyProvider interface. Enables the retrieval of Aleo program proving and
 * verifying keys for the credits.aleo program over http from official Aleo sources and storing and retrieving function
 * keys from a local memory cache.
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
                        return [4 /*yield*/, axios.get(url, { responseType: "arraybuffer" })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, new Uint8Array(response.data)];
                    case 2:
                        error_1 = _a.sent();
                        throw new Error("Error fetching data." + error_1);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Use local memory to store keys
     *
     * @param {boolean} useCache whether to store keys in local memory
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
    /**
     * Cache a set of keys. This will overwrite any existing keys with the same keyId. The user can check if a keyId
     * exists in the cache using the containsKeys method prior to calling this method if overwriting is not desired.
     *
     * @param {string} keyId access key for the cache
     * @param {FunctionKeyPair} keys keys to cache
     */
    AleoKeyProvider.prototype.cacheKeys = function (keyId, keys) {
        this.cache.set(keyId, keys);
    };
    /**
     * Determine if a keyId exists in the cache
     *
     * @param {string} keyId keyId of a proving and verifying key pair
     * @returns {boolean} true if the keyId exists in the cache, false otherwise
     */
    AleoKeyProvider.prototype.containsKeys = function (keyId) {
        return this.cache.has(keyId);
    };
    /**
     * Delete a set of keys from the cache
     *
     * @param {string} keyId keyId of a proving and verifying key pair to delete from memory
     * @returns {boolean} true if the keyId exists in the cache and was deleted, false if the key did not exist
     */
    AleoKeyProvider.prototype.deleteKeys = function (keyId) {
        return this.cache["delete"](keyId);
    };
    /**
     * Get a set of keys from the cache
     * @param keyId keyId of a proving and verifying key pair
     *
     * @returns {FunctionKeyPair | Error} Proving and verifying keys for the specified program
     */
    AleoKeyProvider.prototype.getKeys = function (keyId) {
        if (this.cache.has(keyId)) {
            return this.cache.get(keyId);
        }
        else {
            return new Error("Key not found in cache.");
        }
    };
    /**
     * Get arbitrary function keys from a provider
     *
     * @param {KeySearchParams} params parameters for the key search in form of: {proverUri: string, verifierUri: string, cacheKey: string}
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the specified program
     *
     * @example
     * // Create a new object which implements the KeyProvider interface
     * const networkClient = new AleoNetworkClient("https://vm.aleo.org/api");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     * const AleoProviderParams = new AleoProviderParams("https://testnet3.parameters.aleo.org/transfer_private.");
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
     * const programManager = new ProgramManager("https://vm.aleo.org/api", keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     *
     * // Keys can also be fetched manually using the key provider
     * const keySearchParams = { "cacheKey": "myProgram:myFunction" };
     * const [transferPrivateProvingKey, transferPrivateVerifyingKey] = await keyProvider.functionKeys(keySearchParams);
     */
    AleoKeyProvider.prototype.functionKeys = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var proverUrl, verifierUrl, cacheKey;
            return __generator(this, function (_a) {
                if (params) {
                    proverUrl = void 0;
                    verifierUrl = void 0;
                    cacheKey = void 0;
                    if ("proverUrl" in params && typeof params["proverUrl"] == "string") {
                        proverUrl = params["proverUrl"];
                    }
                    if ("verifierUrl" in params && typeof params["verifierUrl"] == "string") {
                        verifierUrl = params["verifierUrl"];
                    }
                    if ("cacheKey" in params && typeof params["cacheKey"] == "string") {
                        cacheKey = params["cacheKey"];
                    }
                    if (proverUrl && verifierUrl) {
                        return [2 /*return*/, this.fetchKeys(proverUrl, verifierUrl, cacheKey)];
                    }
                    if (cacheKey) {
                        return [2 /*return*/, this.getKeys(cacheKey)];
                    }
                }
                throw Error("Invalid parameters provided, must provide either a cacheKey and/or a proverUrl and a verifierUrl");
            });
        });
    };
    /**
     * Returns the proving and verifying keys for a specified program from a specified url.
     *
     * @param {string} verifierUrl Url of the proving key
     * @param {string} proverUrl Url the verifying key
     * @param {string} cacheKey Key to store the keys in the cache
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
     * const programManager = new ProgramManager("https://vm.aleo.org/api", keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     *
     * // Keys can also be fetched manually
     * const [transferPrivateProvingKey, transferPrivateVerifyingKey] = await keyProvider.fetchKeys("https://testnet3.parameters.aleo.org/transfer_private.prover.2a9a6f2", "https://testnet3.parameters.aleo.org/transfer_private.verifier.3a59762");
     */
    AleoKeyProvider.prototype.fetchKeys = function (proverUrl, verifierUrl, cacheKey) {
        return __awaiter(this, void 0, void 0, function () {
            var value, provingKey, _a, _b, verifyingKey, _c, _d, provingKey, _e, _f, verifyingKey, _g, _h, error_2;
            return __generator(this, function (_j) {
                switch (_j.label) {
                    case 0:
                        _j.trys.push([0, 9, , 10]);
                        if (!this.cacheOption) return [3 /*break*/, 5];
                        if (!cacheKey) {
                            cacheKey = proverUrl + verifierUrl;
                        }
                        value = this.cache.get(cacheKey);
                        if (!(typeof value !== "undefined")) return [3 /*break*/, 1];
                        return [2 /*return*/, value];
                    case 1:
                        _b = (_a = ProvingKey).fromBytes;
                        return [4 /*yield*/, this.fetchBytes(proverUrl)];
                    case 2:
                        provingKey = _b.apply(_a, [_j.sent()]);
                        _d = (_c = VerifyingKey).fromBytes;
                        return [4 /*yield*/, this.fetchBytes(verifierUrl)];
                    case 3:
                        verifyingKey = _d.apply(_c, [_j.sent()]);
                        this.cache.set(cacheKey, [provingKey, verifyingKey]);
                        return [2 /*return*/, [provingKey, verifyingKey]];
                    case 4: return [3 /*break*/, 8];
                    case 5:
                        _f = (_e = ProvingKey).fromBytes;
                        return [4 /*yield*/, this.fetchBytes(proverUrl)];
                    case 6:
                        provingKey = _f.apply(_e, [_j.sent()]);
                        _h = (_g = VerifyingKey).fromBytes;
                        return [4 /*yield*/, this.fetchBytes(verifierUrl)];
                    case 7:
                        verifyingKey = _h.apply(_g, [_j.sent()]);
                        return [2 /*return*/, [provingKey, verifyingKey]];
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        error_2 = _j.sent();
                        throw new Error("Error: ".concat(error_2, " fetching fee proving and verifying keys from ").concat(proverUrl, " and ").concat(verifierUrl, "."));
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns the proving and verifying keys for the transfer functions in the credits.aleo program
     * @param {string} visibility Visibility of the transfer function
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the transfer functions
     *
     * @example
     * // Create a new AleoKeyProvider
     * const networkClient = new AleoNetworkClient("https://vm.aleo.org/api");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
     * const programManager = new ProgramManager("https://vm.aleo.org/api", keyProvider, recordProvider);
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
                            case "private" || "transfer_private" || "transferPrivate": return [3 /*break*/, 1];
                            case "public" || "transfer_public" || "transferPublic": return [3 /*break*/, 3];
                            case "private_to_public" || "transfer_private_to_public" || "privateToPublic" || "transferPrivateToPublic": return [3 /*break*/, 5];
                            case "public_to_private" || "transfer_public_to_private" || "publicToPrivate" || "transferPublicToPrivate": return [3 /*break*/, 7];
                        }
                        return [3 /*break*/, 9];
                    case 1: return [4 /*yield*/, this.fetchKeys(CREDITS_PROGRAM_KEYS.transfer_private.prover, CREDITS_PROGRAM_KEYS.transfer_private.verifier)];
                    case 2: return [2 /*return*/, _b.sent()];
                    case 3: return [4 /*yield*/, this.fetchKeys(CREDITS_PROGRAM_KEYS.transfer_public.prover, CREDITS_PROGRAM_KEYS.transfer_public.verifier)];
                    case 4: return [2 /*return*/, _b.sent()];
                    case 5: return [4 /*yield*/, this.fetchKeys(CREDITS_PROGRAM_KEYS.transfer_private_to_public.prover, CREDITS_PROGRAM_KEYS.transfer_private_to_public.verifier)];
                    case 6: return [2 /*return*/, _b.sent()];
                    case 7: return [4 /*yield*/, this.fetchKeys(CREDITS_PROGRAM_KEYS.transfer_public_to_private.prover, CREDITS_PROGRAM_KEYS.transfer_public_to_private.verifier)];
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
                    case 0: return [4 /*yield*/, this.fetchKeys(CREDITS_PROGRAM_KEYS.join.prover, CREDITS_PROGRAM_KEYS.join.verifier)];
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
                    case 0: return [4 /*yield*/, this.fetchKeys(CREDITS_PROGRAM_KEYS.split.prover, CREDITS_PROGRAM_KEYS.split.verifier)];
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
                    case 0: return [4 /*yield*/, this.fetchKeys(CREDITS_PROGRAM_KEYS.fee.prover, CREDITS_PROGRAM_KEYS.fee.verifier)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return AleoKeyProvider;
}());
export { AleoKeyProvider, AleoKeyProviderParams };
//# sourceMappingURL=function-key-provider.js.map