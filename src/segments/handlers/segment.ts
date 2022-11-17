import { ALBEvent, ALBResult } from "aws-lambda";
import { ServiceError } from "../../shared/types";
import delaySCC from "../../manifests/utils/corruptions/delay";
import statusCodeSCC from "../../manifests/utils/corruptions/statusCode";
import timeoutSCC from "../../manifests/utils/corruptions/timeout";
import { corruptorConfigUtils } from "../../manifests/utils/configs";
import { generateErrorResponse, isValidUrl, refineALBEventQuery } from "../../shared/utils";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function segmentHandler(event: ALBEvent): Promise<ALBResult> {
  // To be able to reuse the handlers for AWS lambda function - input should be ALBEvent
  const query = refineALBEventQuery(event.queryStringParameters);

  if (!query.url || !isValidUrl(query.url)) {
    const errorRes: ServiceError = {
      status: 400,
      message: "Missing a valid 'url' query parameter",
    };
    return generateErrorResponse(errorRes);
  }
  try {
    const configUtils = corruptorConfigUtils(new URLSearchParams(query));
    configUtils.register(delaySCC).register(statusCodeSCC).register(timeoutSCC);

    const [error, allSegmentCorr] = configUtils.getAllSegmentConfigs();
    if (error) {
      return generateErrorResponse(error);
    }
    // apply Timeout
    if (allSegmentCorr.get("timeout")) {
      console.log(`Timing out ${query.url}`);
      return;
    }
    // apply Delay
    if (allSegmentCorr.get("delay")) {
      const delay = Number(allSegmentCorr.get("delay").fields?.ms);
      console.log(`Applying ${delay}ms delay to ${query.url}`);
      await sleep(delay);
    }
    // apply Status Code
    if (allSegmentCorr.get("statusCode") && allSegmentCorr.get("statusCode").fields.code !== "undefined") {
      const code = <number>allSegmentCorr.get("statusCode").fields.code;
      console.log(`Applying corruption with status ${code} to ${query.url}`);
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
      statusCode: 302,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Origin",
        Location: query.url,
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
