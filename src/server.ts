import fastify from "fastify";
import { registerRoutes } from "./routes";

const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

// App
const app = fastify();
app.register(require("fastify-cors"), {});

// Routes
registerRoutes(app);

// Start
app.listen(PORT, "0.0.0.0", (err, address) => {
  console.log(`Server listening on ${address}`);
});
