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
const segment_1 = __importDefault(require("../handlers/segment"));
const utils_1 = require("../../shared/utils");
function segmentRoutes(fastify) {
    return __awaiter(this, void 0, void 0, function* () {
        fastify.get("/segments/proxy-segment", (req, res) => __awaiter(this, void 0, void 0, function* () {
            const event = utils_1.convertToALBEvent(req);
            const response = yield segment_1.default(event);
            if (response === undefined) {
                return;
            }
            if (response.statusCode === 301) {
                res.headers({
                    "Access-Control-Allow-Origin": "*",
                });
                res.redirect(301, response.headers.Location);
                return;
            }
            res.code(response.statusCode).headers(response.headers).send(response.body);
        }));
        fastify.options("/*", (req, res) => __awaiter(this, void 0, void 0, function* () {
            const event = utils_1.convertToALBEvent(req);
            const response = yield utils_1.handleOptionsRequest(event);
            res.code(response.statusCode).headers(response.headers);
        }));
    });
}
exports.default = segmentRoutes;
//# sourceMappingURL=index.js.map