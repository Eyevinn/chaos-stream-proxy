import { FastifyInstance } from "fastify";
import segmentRoutes from "./segments/routes";
import manifestRoutes from "./manifests/routes";

const apiPrefix = (version: number): string => `api/v${version}`;

export function registerRoutes(app: FastifyInstance) {
  const opts = { prefix: apiPrefix(2) };
  app.register(segmentRoutes, opts);
  app.register(manifestRoutes, opts);
}
