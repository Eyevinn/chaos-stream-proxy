"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = void 0;
const routes_1 = __importDefault(require("./segments/routes"));
const routes_2 = __importDefault(require("./manifests/routes"));
const apiPrefix = (version) => `api/v${version}`;
function registerRoutes(app) {
    const opts = { prefix: apiPrefix(2) };
    app.register(routes_1.default, opts);
    app.register(routes_2.default, opts);
}
exports.registerRoutes = registerRoutes;
//# sourceMappingURL=routes.js.map