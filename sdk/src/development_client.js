import { __awaiter, __generator } from "tslib";
import axios from 'axios';
var config = {
    headers: {
        "Content-type": "application/json; charset=UTF-8",
        "Referrer-Policy": "no-referrer"
    }
};
var DevelopmentClient = /** @class */ (function () {
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