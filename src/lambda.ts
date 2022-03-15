import { ALBResult, ALBEvent, ALBHandler } from "aws-lambda";
import hlsMasterHandler from "./manifests/handlers/hls/master";
import hlsMediaHandler from "./manifests/handlers/hls/media";
import segmentHandler from "./segments/handlers/segment";
import { generateErrorResponse, generateHeartbeatResponse, refineALBEventQuery } from "./shared/utils";
import { handleOptionsRequest } from "./shared/utils";

export interface ILogger {
  verbose: (message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

export class AbstractLogger implements ILogger {
  private doLog(level: string, message: string) {
    if (process.env.NODE_ENV === "development") {
      console.log(`${level}: ${message}`);
    }
  }

  verbose(message: string) {
    this.doLog("VERBOSE", message);
  }

  info(message: string) {
    this.doLog("INFO", message);
  }

  warn(message: string) {
    this.doLog("WARN", message);
  }

  error(message: string) {
    console.error(message);
  }
}

const logger = new AbstractLogger();

export const handler: ALBHandler = async (event: ALBEvent): Promise<ALBResult> => {
  // This is needed because Internet is a bit broken...
  event.queryStringParameters = refineALBEventQuery(event.queryStringParameters);
  let response: ALBResult;
  try {
    if (event.path.match(/manifests\/hls\/proxy-master$/) && event.httpMethod === "GET") {
      logger.info("Request for HLS Proxy-Multivariant Playlist...");
      response = await hlsMasterHandler(event);
    } else if (event.path.match(/manifests\/hls\/proxy-media$/) && event.httpMethod === "GET") {
      logger.info("Request for HLS Proxy-Media Playlist...");
      response = await hlsMediaHandler(event);
    } else if (event.path.match(/segments\/proxy-segment$/) && event.httpMethod === "GET") {
      logger.info("Request for HLS Proxy-Segment...");
      response = await segmentHandler(event);
    } else if (event.path.match(/manifests\/dash\/proxy-master$/) && event.httpMethod === "GET") {
      logger.info("Request for DASH Proxy-Manifest...");
      response = await generateErrorResponse({
        status: 404,
        message: "Endpoint not implemented...",
      });
    } else if (event.httpMethod === "OPTIONS") {
      logger.info("Request for OPTIONS...");
      response = await handleOptionsRequest(event);
    } else if (event.path === "/" && event.httpMethod === "GET") {
      logger.info("Request for Healthcheck...");
      response = await generateHeartbeatResponse();
    } else {
      logger.info("Request for missing resource...");
      response = await generateErrorResponse({
        status: 404,
        message: "Resource not found",
      });
    }
  } catch (error) {
    logger.error(error);
    response = await generateErrorResponse({
      status: 500,
      message: error.message ? error.message : error,
    });
  }
  return response;
};
