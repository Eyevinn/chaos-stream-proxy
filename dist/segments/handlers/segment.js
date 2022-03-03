"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const delay_1 = __importDefault(require("../../manifests/utils/corruptions/delay"));
const statusCode_1 = __importDefault(require("../../manifests/utils/corruptions/statusCode"));
const timeout_1 = __importDefault(require("../../manifests/utils/corruptions/timeout"));
const configs_1 = require("../../manifests/utils/configs");
const utils_1 = require("../../shared/utils");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function segmentHandler(event) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        // To be able to reuse the handlers for AWS lambda function - input should be ALBEvent
        // This is needed because Internet is a bit broken...
        event.queryStringParameters = utils_1.refineALBEventQuery(event.queryStringParameters);
        if (!event.queryStringParameters["url"] || !utils_1.isValidUrl(event.queryStringParameters["url"])) {
            const errorRes = {
                status: 400,
                message: "Missing a valid 'url' query parameter",
            };
            return utils_1.generateErrorResponse(errorRes);
        }
        try {
            const reqQueryParams = new URLSearchParams(event.queryStringParameters);
            const configUtils = configs_1.corruptorConfigUtils(reqQueryParams);
            configUtils.register(delay_1.default).register(statusCode_1.default).register(timeout_1.default);
            const [error, allSegmentCorr] = configUtils.getAllSegmentConfigs();
            if (error) {
                return utils_1.generateErrorResponse(error);
            }
            // apply Timeout
            if (allSegmentCorr.get("timeout")) {
                return;
            }
            // apply Delay
            if (allSegmentCorr.get("delay")) {
                const delayMs = ((_a = allSegmentCorr.get("delay").fields) === null || _a === void 0 ? void 0 : _a.ms) || 0;
                yield sleep(delayMs); // TODO Medela kanske?
            }
            // apply Status Code
            if (allSegmentCorr.get("statusCode") && allSegmentCorr.get("statusCode").fields.code !== "undefined") {
                const code = allSegmentCorr.get("statusCode").fields.code;
                return {
                    statusCode: code,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Headers": "Content-Type, Origin",
                    },
                    body: JSON.stringify({ message: "[Stream Corruptor]: Applied Status Code Corruption" }),
                };
            }
            // Redirect to Source File
            return {
                statusCode: 301,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type, Origin",
                    Location: event.queryStringParameters["url"],
                },
                body: "stream corruptor redirect",
            };
        }
        catch (err) {
            const errorRes = {
                status: 500,
                message: err.message ? err.message : err,
            };
            return utils_1.generateErrorResponse(errorRes);
        }
    });
}
exports.default = segmentHandler;
//# sourceMappingURL=segment.js.map