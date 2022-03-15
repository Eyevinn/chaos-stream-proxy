import fastify from "fastify";
import { registerRoutes } from "./routes";

const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

// App
const app = fastify();
app.register(require("fastify-cors"), {});

// Routes
registerRoutes(app);

// Start
app.listen(PORT, () => {
  console.log("\nChaos Stream Proxy listening on port:", PORT, "\n");
});
