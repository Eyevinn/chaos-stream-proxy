import hlsMasterHandler from "../handlers/hls/master";
import hlsMediaHandler from "../handlers/hls/media";
import dashHandler from "../handlers/dash";
import { FastifyInstance } from "fastify";
import { ALBResult } from "aws-lambda";
import { convertToALBEvent } from "../../shared/utils";

export default async function manifestRoutes(fastify: FastifyInstance) {
  fastify.get("/manifests/hls/proxy-master", async (req, res) => {
    const event = convertToALBEvent(req);
    const response: ALBResult = await hlsMasterHandler(event);
    res.code(response.statusCode).headers(response.headers).send(response.body);
  });

  fastify.get("/manifests/hls/proxy-media", async (req, res) => {
    const event = convertToALBEvent(req);
    const response: ALBResult = await hlsMediaHandler(event);
    res.code(response.statusCode).headers(response.headers).send(response.body);
  });

  fastify.get("/manifests/dash/proxy-master", dashHandler);
}
