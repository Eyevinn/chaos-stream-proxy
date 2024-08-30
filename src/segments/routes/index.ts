import { FastifyInstance } from 'fastify';
import segmentHandler from '../handlers/segment';
import { composeALBEvent, handleOptionsRequest } from '../../shared/utils';
import { SEGMENTS_PROXY_SEGMENT } from '../constants';

export default async function segmentRoutes(fastify: FastifyInstance) {
  fastify.head('/*', async (req, res) => {
    res.code(200).send();
  });
  fastify.get(SEGMENTS_PROXY_SEGMENT, async (req, res) => {
    const event = await composeALBEvent(req.method, req.url, req.headers);
    const response = await segmentHandler(event);
    // If response is undefined it means the request was intentionally timed out and we must not respond
    if (!response) {
      return;
    }
    if (response.statusCode === 302) {
      res.headers({
        'Access-Control-Allow-Origin': '*'
      });
      res.redirect(302, response.headers.Location as string);
      return;
    }
    response.headers['Accept-Ranges'] = 'bytes';
    res.code(response.statusCode).headers(response.headers).send(response.body);
  });
  fastify.options('/*', async (req, res) => {
    const response = await handleOptionsRequest();
    res.code(response.statusCode).headers(response.headers);
  });
}
