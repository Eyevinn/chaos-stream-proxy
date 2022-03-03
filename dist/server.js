"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const routes_1 = require("./routes");
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
// App
const app = fastify_1.default();
app.register(require("fastify-cors"), {});
// Routes
routes_1.registerRoutes(app);
// Start
app.listen(PORT, () => {
    console.log("\nListening on port:", PORT, "\n");
});
//# sourceMappingURL=server.js.map