import fastify from 'fastify';
import { registerRoutes } from './routes';
import {
  HLS_PROXY_MASTER,
  HLS_PROXY_MEDIA,
  SEGMENTS_PROXY_SEGMENT
} from './segments/constants';

describe('Chaos Stream Proxy server', () => {
  let app = null;
  beforeEach(() => {
    app = fastify();
    registerRoutes(app);
  });

  it.each([HLS_PROXY_MASTER, HLS_PROXY_MEDIA, SEGMENTS_PROXY_SEGMENT])(
    'route %p contains x-version header',
    async (route) => {
      const response = await app.inject(route);
      expect(response.headers).toEqual(
        expect.objectContaining({
          'x-version': process.env.npm_package_version
        })
      );
    }
  );
});
