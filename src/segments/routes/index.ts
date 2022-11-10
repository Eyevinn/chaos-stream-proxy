import { FastifyInstance } from "fastify";
import segmentHandler from "../handlers/segment";
import { composeALBEvent, handleOptionsRequest } from "../../shared/utils";
import { SEGMENTS_PROXY_SEGMENT } from "../constants";

export default async function segmentRoutes(fastify: FastifyInstance) {
  fastify.get(SEGMENTS_PROXY_SEGMENT, async (req, res) => {
    const event = composeALBEvent(req.method, req.url, req.headers);
    const response = await segmentHandler(event);
    if (response === undefined) {
      return;
    }
    if (response.statusCode === 301) {
      res.headers({
        "Access-Control-Allow-Origin": "*",
      });
      res.redirect(301, response.headers.Location as string);
      return;
    }
    res.code(response.statusCode).headers(response.headers).send(response.body);
  });
  fastify.options("/*", async (req, res) => {
    const event = composeALBEvent(req.method, req.url, req.headers);
    const response = await handleOptionsRequest(event);
    res.code(response.statusCode).headers(response.headers);
  });
}
