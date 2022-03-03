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
const hlsManifestUtils_1 = __importDefault(require("../../utils/hlsManifestUtils"));
const utils_1 = require("../../../shared/utils");
// To be able to reuse the handlers for AWS lambda function - input should be ALBEvent
function hlsMasterHandler(event) {
    return __awaiter(this, void 0, void 0, function* () {
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
            const originalMasterManifestResponse = yield node_fetch_1.default(event.queryStringParameters["url"]);
            if (!originalMasterManifestResponse.ok) {
                const errorRes = {
                    status: originalMasterManifestResponse.status,
                    message: "Unsuccessful Source Manifest fetch",
                };
                return utils_1.generateErrorResponse(errorRes);
            }
            const originalResHeaders = {};
            originalMasterManifestResponse.headers.forEach((value, key) => (originalResHeaders[key] = value));
            const masterM3U = yield utils_1.parseM3U8Text(originalMasterManifestResponse);
            // How to handle if M3U is actually a Media and Not a Master...
            if (masterM3U.items.PlaylistItem.length > 0) {
                const errorRes = {
                    status: 400,
                    message: "Input HLS stream URL is not a Multivariant Playlist",
                };
                return utils_1.generateErrorResponse(errorRes);
            }
            const reqQueryParams = new URLSearchParams(event.queryStringParameters);
            const manifestUtils = hlsManifestUtils_1.default();
            const proxyManifest = manifestUtils.createProxyMasterManifest(masterM3U, reqQueryParams);
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
exports.default = hlsMasterHandler;
//# sourceMappingURL=master.js.map