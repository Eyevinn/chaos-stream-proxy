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
const node_fetch_1 = __importDefault(require("node-fetch"));
const utils_1 = require("../../../shared/utils");
const delay_1 = __importDefault(require("../../utils/corruptions/delay"));
const statusCode_1 = __importDefault(require("../../utils/corruptions/statusCode"));
const timeout_1 = __importDefault(require("../../utils/corruptions/timeout"));
const path_1 = __importDefault(require("path"));
const hlsManifestUtils_1 = __importDefault(require("../../utils/hlsManifestUtils"));
const configs_1 = require("../../utils/configs");
function hlsMediaHandler(event) {
    return __awaiter(this, void 0, void 0, function* () {
        // To be able to reuse the handlers for AWS lambda function - input should be ALBEvent
        // This is needed because Internet is a bit broken...
        event.queryStringParameters = utils_1.refineALBEventQuery(event.queryStringParameters);
        const originalManifestUrl = event.queryStringParameters["url"];
        // Check for original manifest url in query params
        if (!utils_1.isValidUrl(originalManifestUrl)) {
            const errorRes = {
                status: 400,
                message: "Missing a valid 'url' query parameter",
            };
            return utils_1.generateErrorResponse(errorRes);
        }
        try {
            const originalMediaManifestResponse = yield node_fetch_1.default(originalManifestUrl);
            if (!originalMediaManifestResponse.ok) {
                const errorRes = {
                    status: originalMediaManifestResponse.status,
                    message: "Unsuccessful Source Manifest fetch",
                };
                return utils_1.generateErrorResponse(errorRes);
            }
            const originalResHeaders = {};
            originalMediaManifestResponse.headers.forEach((value, key) => (originalResHeaders[key] = value));
            const mediaM3U = yield utils_1.parseM3U8Text(originalMediaManifestResponse);
            const reqQueryParams = new URLSearchParams(event.queryStringParameters);
            const manifestUtils = hlsManifestUtils_1.default();
            const configUtils = configs_1.corruptorConfigUtils(reqQueryParams);
            configUtils.register(delay_1.default).register(statusCode_1.default).register(timeout_1.default);
            const [error, allMutations] = configUtils.getAllManifestConfigs(mediaM3U.get("mediaSequence"));
            if (error) {
                return utils_1.generateErrorResponse(error);
            }
            const sourceBaseURL = path_1.default.dirname(event.queryStringParameters["url"]);
            const proxyManifest = manifestUtils.createProxyMediaManifest(mediaM3U, sourceBaseURL, allMutations);
            return {
                statusCode: 200,
                headers: {
                    "Content-Type": "application/x-mpegURL",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type, Origin",
                },
                body: proxyManifest,
            };
        }
        catch (err) {
            const errorRes = {
                status: 500,
                message: err.message ? err.message : err,
            };
            //för oväntade fel
            return utils_1.generateErrorResponse(errorRes);
        }
    });
}
exports.default = hlsMediaHandler;
//# sourceMappingURL=media.js.map