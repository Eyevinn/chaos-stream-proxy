import { FastifyInstance } from 'fastify';
import segmentRoutes from './segments/routes';
import manifestRoutes from './manifests/routes';
import {
  generateHeartbeatResponse,
  addCustomVersionHeader
} from './shared/utils';
import throttlingProxyRoutes from './segments/routes/throttlingProxy';

const apiPrefix = (version: number): string => `api/v${version}`;

export default async function heartbeatRoute(fastify: FastifyInstance) {
  fastify.get('/', async (req, res) => {
    const response = await generateHeartbeatResponse();
    res.code(response.statusCode).headers(response.headers).send(response.body);
  });
}

export function registerRoutes(app: FastifyInstance) {
  app.register(heartbeatRoute);
  const opts = { prefix: apiPrefix(2) };
  app.register(segmentRoutes, opts);
  app.register(manifestRoutes, opts);
  app.register(throttlingProxyRoutes, opts);
  addCustomVersionHeader(app);
}
