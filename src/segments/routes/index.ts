import { ALBEvent, ALBResult } from "aws-lambda";
import { FastifyInstance } from "fastify";
import { GET_ROUTE_URL } from "../constants";
import segmentHandler from "../handlers/segment";
import { convertToALBEvent, handleOptionsRequest } from "../../shared/utils";

export default async function segmentRoutes(fastify: FastifyInstance) {
  fastify.get("/segments/proxy-segment", async (req, res) => {
    const event = convertToALBEvent(req);
    const response: ALBResult = await segmentHandler(event);
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
    const event = convertToALBEvent(req);
    const response: ALBResult = await handleOptionsRequest(event);
    res.code(response.statusCode).headers(response.headers);
  });
}
