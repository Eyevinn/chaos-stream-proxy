import hlsMasterHandler from "../handlers/hls/master";
import hlsMediaHandler from "../handlers/hls/media";
import dashHandler from "../handlers/dash/index";
import { FastifyInstance } from "fastify";
import { ALBResult } from "aws-lambda";
import { convertToALBEvent } from "../../shared/utils";
import { HLS_PROXY_MASTER, HLS_PROXY_MEDIA, DASH_PROXY_MASTER, DASH_PROXY_SEGMENT } from "../../segments/constants";
import dashSegmentHandler from "../handlers/dash/segment";

export default async function manifestRoutes(fastify: FastifyInstance) {
  fastify.get(HLS_PROXY_MASTER, async (req, res) => {
    const event = convertToALBEvent(req);
    const response: ALBResult = await hlsMasterHandler(event);
    res.code(response.statusCode).headers(response.headers).send(response.body);
  });

  fastify.get(HLS_PROXY_MEDIA, async (req, res) => {
    const event = convertToALBEvent(req);
    const response: ALBResult = await hlsMediaHandler(event);
    res.code(response.statusCode).headers(response.headers).send(response.body);
  });
  fastify.get(DASH_PROXY_MASTER, async (req, res) => {
    const event = convertToALBEvent(req);
    const response: ALBResult = await dashHandler(event);
    res.code(response.statusCode).headers(response.headers).send(response.body);
  });
  fastify.get(DASH_PROXY_SEGMENT, async (req, res) => {
    const event = convertToALBEvent(req);
    const response: ALBResult = await dashSegmentHandler(event);
    res.code(response.statusCode).headers(response.headers).send(response.body);
  });

}
