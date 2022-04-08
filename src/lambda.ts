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

    if (event.httpMethod === "GET") {
      const path =event.path.replace("/api/v2","")
      switch (path) {
        case "/manifests/hls/proxy-master.m3u8" :
          logger.info("Request for HLS Proxy-Multivariant Playlist...");
          response = await hlsMasterHandler(event);
          break;
        case "/manifests/hls/proxy-media.m3u8" :
          logger.info("Request for HLS Proxy-Media Playlist...");
          response = await hlsMediaHandler(event);
          break;
        case "/segments/proxy-segment" :
          logger.info("Request for HLS Proxy-Segment...");
          response = await segmentHandler(event);
          break;
        case "/manifests/dash/proxy-master" :
          logger.info("Request for DASH Proxy-Manifest...");
          response = await generateErrorResponse({
            status: 404,
            message: "Endpoint not implemented...",
          });
          break;
        case "/" :
          logger.info("Request for Healthcheck...");
          response = await generateHeartbeatResponse();
          break;
        default: 
          logger.info("Request for missing resource...");
          response = await generateErrorResponse({
            status: 404,
            message: "Resource not found",
          });
      } 
    } else if (event.httpMethod === "OPTIONS") {
      logger.info("Request for OPTIONS...");
      response = await handleOptionsRequest(event);
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
