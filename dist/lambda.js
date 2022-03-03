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
exports.handler = exports.AbstractLogger = void 0;
const master_1 = __importDefault(require("./manifests/handlers/hls/master"));
const media_1 = __importDefault(require("./manifests/handlers/hls/media"));
const segment_1 = __importDefault(require("./segments/handlers/segment"));
const utils_1 = require("./shared/utils");
const utils_2 = require("./shared/utils");
class AbstractLogger {
    doLog(level, message) {
        console.log(`${level}: ${message}`);
    }
    verbose(message) {
        this.doLog("VERBOSE", message);
    }
    info(message) {
        this.doLog("INFO", message);
    }
    warn(message) {
        this.doLog("WARN", message);
    }
    error(message) {
        // TODO
    }
}
exports.AbstractLogger = AbstractLogger;
const logger = new AbstractLogger();
exports.handler = (event) => __awaiter(void 0, void 0, void 0, function* () {
    // This is needed because Internet is a bit broken...
    event.queryStringParameters = utils_1.refineALBEventQuery(event.queryStringParameters);
    let response;
    try {
        if (event.path.match(/manifests\/hls\/proxy-master$/) && event.httpMethod === "GET") {
            logger.info("Request for HLS Proxy-Multivariant Playlist...");
            response = yield master_1.default(event);
        }
        else if (event.path.match(/manifests\/hls\/proxy-media$/) && event.httpMethod === "GET") {
            logger.info("Request for HLS Proxy-Media Playlist...");
            response = yield media_1.default(event);
        }
        else if (event.path.match(/segments\/proxy-segment$/) && event.httpMethod === "GET") {
            logger.info("Request for HLS Proxy-Segment...");
            response = yield segment_1.default(event);
        }
        else if (event.path.match(/manifests\/dash\/proxy-master$/) && event.httpMethod === "GET") {
            logger.info("Request for DASH Proxy-Manifest...");
            response = yield utils_1.generateErrorResponse({
                status: 404,
                message: "Endpoint not implemented...",
            });
        }
        else if (event.httpMethod === "OPTIONS") {
            logger.info("Request for OPTIONS...");
            response = yield utils_2.handleOptionsRequest(event);
        }
        else {
            logger.info("Request for missing resource...");
            response = yield utils_1.generateErrorResponse({
                status: 404,
                message: "Resource not found",
            });
        }
    }
    catch (error) {
        logger.error(error);
        response = yield utils_1.generateErrorResponse({
            status: 500,
            message: error.message ? error.message : error,
        });
    }
    return response;
});
//# sourceMappingURL=lambda.js.map