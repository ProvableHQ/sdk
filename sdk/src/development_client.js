import { __awaiter, __generator } from "tslib";
var DevelopmentClient = /** @class */ (function () {
    function DevelopmentClient(baseURL) {
        this.baseURL = baseURL;
    }
    DevelopmentClient.prototype.sendRequest = function (path, request) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("".concat(this.baseURL, "/testnet3").concat(path), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(request)
                        })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Error sending request: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DevelopmentClient.prototype.deployProgram = function (program, fee, privateKey, password, feeRecord) {
        return __awaiter(this, void 0, void 0, function () {
            var request;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {
                            program: program,
                            fee: fee,
                            privateKey: privateKey,
                            password: password,
                            feeRecord: feeRecord
                        };
                        return [4 /*yield*/, this.sendRequest('/deploy', request)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DevelopmentClient.prototype.executeProgram = function (programId, programFunction, fee, inputs, privateKey, password, feeRecord) {
        return __awaiter(this, void 0, void 0, function () {
            var request;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {
                            programId: programId,
                            programFunction: programFunction,
                            inputs: inputs,
                            privateKey: privateKey,
                            password: password,
                            fee: fee,
                            feeRecord: feeRecord
                        };
                        return [4 /*yield*/, this.sendRequest('/execute', request)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DevelopmentClient.prototype.transfer = function (amount, fee, recipient, privateKey, password, feeRecord, amountRecord) {
        return __awaiter(this, void 0, void 0, function () {
            var request;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {
                            amount: amount,
                            fee: fee,
                            recipient: recipient,
                            privateKey: privateKey,
                            password: password,
                            feeRecord: feeRecord,
                            amountRecord: amountRecord
                        };
                        return [4 /*yield*/, this.sendRequest('/transfer', request)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return DevelopmentClient;
}());
export default DevelopmentClient;
//# sourceMappingURL=development_client.js.map