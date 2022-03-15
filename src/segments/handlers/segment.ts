// import ManifestUtils, { SegmentCorruptorQueryConfig, HLSManifestProxyUtils } from "../../utils/utils";
import fetch, { Response } from "node-fetch";
import { ALBHandler, ALBEvent, ALBResult } from "aws-lambda";
import { ServiceError } from "../../shared/types";
import delaySCC from "../../manifests/utils/corruptions/delay";
import statusCodeSCC from "../../manifests/utils/corruptions/statusCode";
import timeoutSCC from "../../manifests/utils/corruptions/timeout";
import { corruptorConfigUtils } from "../../manifests/utils/configs";
import { generateErrorResponse, isValidUrl, refineALBEventQuery } from "../../shared/utils";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function segmentHandler(event: ALBEvent): Promise<ALBResult> {
  // To be able to reuse the handlers for AWS lambda function - input should be ALBEvent

  // This is needed because Internet is a bit broken...
  event.queryStringParameters = refineALBEventQuery(event.queryStringParameters);

  if (!event.queryStringParameters["url"] || !isValidUrl(event.queryStringParameters["url"])) {
    const errorRes: ServiceError = {
      status: 400,
      message: "Missing a valid 'url' query parameter",
    };
    return generateErrorResponse(errorRes);
  }
  try {
    const reqQueryParams = new URLSearchParams(event.queryStringParameters);

    const configUtils = corruptorConfigUtils(reqQueryParams);
    configUtils.register(delaySCC).register(statusCodeSCC).register(timeoutSCC);

    const [error, allSegmentCorr] = configUtils.getAllSegmentConfigs();
    if (error) {
      return generateErrorResponse(error);
    }
    // apply Timeout
    if (allSegmentCorr.get("timeout")) {
      return;
    }
    // apply Delay
    if (allSegmentCorr.get("delay")) {
      const delayMs = allSegmentCorr.get("delay").fields?.ms || 0;
      await sleep(delayMs); // TODO Medela kanske?
    }
    // apply Status Code
    if (allSegmentCorr.get("statusCode") && allSegmentCorr.get("statusCode").fields.code !== "undefined") {
      const code = <number>allSegmentCorr.get("statusCode").fields.code;
      return {
        statusCode: code,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Origin",
        },
        body: JSON.stringify({ message: "[Stream Corruptor]: Applied Status Code Corruption" }),
      };
    }
    // Redirect to Source File
    return {
      statusCode: 301,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Origin",
        Location: event.queryStringParameters["url"],
      },
      body: "stream corruptor redirect",
    };
  } catch (err) {
    const errorRes: ServiceError = {
      status: 500,
      message: err.message ? err.message : err,
    };
    return generateErrorResponse(errorRes);
  }
}
