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
const master_1 = __importDefault(require("../handlers/hls/master"));
const media_1 = __importDefault(require("../handlers/hls/media"));
const dash_1 = __importDefault(require("../handlers/dash"));
const utils_1 = require("../../shared/utils");
function manifestRoutes(fastify) {
    return __awaiter(this, void 0, void 0, function* () {
        fastify.get("/manifests/hls/proxy-master", (req, res) => __awaiter(this, void 0, void 0, function* () {
            const event = utils_1.convertToALBEvent(req);
            const response = yield master_1.default(event);
            res.code(response.statusCode).headers(response.headers).send(response.body);
        }));
        fastify.get("/manifests/hls/proxy-media", (req, res) => __awaiter(this, void 0, void 0, function* () {
            const event = utils_1.convertToALBEvent(req);
            const response = yield media_1.default(event);
            res.code(response.statusCode).headers(response.headers).send(response.body);
        }));
        fastify.get("/manifests/dash/proxy-master", dash_1.default);
    });
}
exports.default = manifestRoutes;
//# sourceMappingURL=index.js.map