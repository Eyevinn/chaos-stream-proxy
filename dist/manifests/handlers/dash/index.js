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
function dashHandler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        /**
         * #1 - const originalUrl = req.body.query("url");
         * #2 - const originalManifest = await fetch(originalUrl);
         * #3 - bygg proxy versionen och bygg responsen med rätt header
         */
        if (!req.query["url"] || !utils_1.isValidUrl(req.query["url"])) {
            const errorRes = {
                status: 400,
                message: "Missing a valid 'url' query parameter",
            };
            res.code(400).send(errorRes);
        }
        try {
            const originalDashManifestResponse = yield node_fetch_1.default(req.query["url"]);
            if (!originalDashManifestResponse.ok) {
                const errorRes = {
                    status: originalDashManifestResponse.status,
                    message: "Unsuccessful Source Manifest fetch",
                };
                res.code(originalDashManifestResponse.status).send(errorRes);
                return;
            }
            const originalResHeaders = originalDashManifestResponse.headers;
            const reqQueryParams = new URL(utils_1.SERVICE_ORIGIN + req.url).searchParams;
            // TODO: Fixa allt som behövs inför 'dashManifestHandlerUtils'
            const proxyManifest = "";
            res.code(200).headers(originalResHeaders).send(proxyManifest);
            return;
        }
        catch (err) {
            const errorRes = {
                status: 500,
                message: err.message ? err.message : err,
            };
            // temp: för oväntade fel
            res.code(500).send(errorRes);
        }
    });
}
exports.default = dashHandler;
//# sourceMappingURL=index.js.map