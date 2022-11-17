import fetch, { Response } from "node-fetch";
import { ALBEvent, ALBResult } from "aws-lambda";
import { generateErrorResponse, isValidUrl, parseM3U8Text, refineALBEventQuery } from "../../../shared/utils";
import delaySCC from "../../utils/corruptions/delay";
import statusCodeSCC from "../../utils/corruptions/statusCode";
import timeoutSCC from "../../utils/corruptions/timeout";
import path from "path";
import hlsManifestUtils from "../../utils/hlsManifestUtils";
import { corruptorConfigUtils } from "../../utils/configs";

export default async function hlsMediaHandler(event: ALBEvent): Promise<ALBResult> {
  // To be able to reuse the handlers for AWS lambda function - input should be ALBEvent
  const query = refineALBEventQuery(event.queryStringParameters);

  // Check for original manifest url in query params
  if (!isValidUrl(query.url)) {
    return generateErrorResponse({
      status: 400,
      message: "Missing a valid 'url' query parameter",
    });
  }

  try {
    const originalMediaManifestResponse: Response = await fetch(query.url);
    if (!originalMediaManifestResponse.ok) {
      return generateErrorResponse({
        status: originalMediaManifestResponse.status,
        message: "Unsuccessful Source Manifest fetch",
      });
    }

    const originalResHeaders = {};
    originalMediaManifestResponse.headers.forEach((value, key) => (originalResHeaders[key] = value));

    const mediaM3U = await parseM3U8Text(originalMediaManifestResponse);
    const reqQueryParams = new URLSearchParams(query);
    const manifestUtils = hlsManifestUtils();
    const configUtils = corruptorConfigUtils(reqQueryParams);

    configUtils.register(delaySCC).register(statusCodeSCC).register(timeoutSCC);
 
    const [error, allMutations] = configUtils.getAllManifestConfigs(mediaM3U.get("mediaSequence"));
    if (error) {
      return generateErrorResponse(error);
    }

    const sourceBaseURL = path.dirname(query.url);
    const proxyManifest = manifestUtils.createProxyMediaManifest(mediaM3U, sourceBaseURL, allMutations);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Origin",
      },
      body: proxyManifest,
    };
  } catch (err) {
    // Unexpected errors
    return generateErrorResponse({
      status: 500,
      message: err.message || err,
    });
  }
}
