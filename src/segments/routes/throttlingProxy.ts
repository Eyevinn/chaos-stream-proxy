import { FastifyInstance } from 'fastify';
import { composeALBEvent } from '../../shared/utils';
import { THROTTLING_PROXY } from '../constants';
import fetch from 'node-fetch';
import { Throttle } from 'stream-throttle';

export default async function throttlingProxyRoutes(fastify: FastifyInstance) {
  fastify.get(THROTTLING_PROXY, async (req, res) => {
    const event = await composeALBEvent(req.method, req.url, req.headers);

    const query = event.queryStringParameters;
    if (!query) {
      res.code(501);
      return;
    }
    const url = query['url'];
    const rate = Number(query['rate']);

    const middle = await fetch(url);
    if (middle.status != 200) {
      res.code(500).send('Invalid return code for segment from remote');
    }

    const headers = {};
    middle.headers.forEach((v, k) => {
      headers[k] = v;
    });

    const throttle = new Throttle({ rate });

    res.code(middle.status).headers(headers).send(middle.body.pipe(throttle));
  });
}
