import fetch, { Response } from "node-fetch";
import { ALBEvent, ALBResult } from "aws-lambda";
import { ServiceError, M3U } from "../../../shared/types";
import { generateErrorResponse, isValidUrl, parseM3U8Text, refineALBEventQuery } from "../../../shared/utils";
import delaySCC from "../../utils/corruptions/delay";
import statusCodeSCC from "../../utils/corruptions/statusCode";
import timeoutSCC from "../../utils/corruptions/timeout";
import path from "path";
import hlsManifestUtils from "../../utils/hlsManifestUtils";
import { corruptorConfigUtils } from "../../utils/configs";

export default async function hlsMediaHandler(event: ALBEvent): Promise<ALBResult> {
  // To be able to reuse the handlers for AWS lambda function - input should be ALBEvent

  // This is needed because Internet is a bit broken...
  event.queryStringParameters = refineALBEventQuery(event.queryStringParameters);

  const originalManifestUrl = event.queryStringParameters["url"];

  // Check for original manifest url in query params
  if (!isValidUrl(originalManifestUrl)) {
    const errorRes: ServiceError = {
      status: 400,
      message: "Missing a valid 'url' query parameter",
    };
    return generateErrorResponse(errorRes);
  }

  try {
    const originalMediaManifestResponse: Response = await fetch(originalManifestUrl);
    console.log(originalMediaManifestResponse)

    if (!originalMediaManifestResponse.ok) {
      const errorRes: ServiceError = {
        status: originalMediaManifestResponse.status,
        message: "Unsuccessful Source Manifest fetch",
      };
      return generateErrorResponse(errorRes);
    }

    const originalResHeaders = {};
    originalMediaManifestResponse.headers.forEach((value, key) => (originalResHeaders[key] = value));

    const mediaM3U: M3U = await parseM3U8Text(originalMediaManifestResponse);
    
    const reqQueryParams = new URLSearchParams(event.queryStringParameters);

    const manifestUtils = hlsManifestUtils();
    const configUtils = corruptorConfigUtils(reqQueryParams);

    configUtils.register(delaySCC).register(statusCodeSCC).register(timeoutSCC);
 
    const [error, allMutations] = configUtils.getAllManifestConfigs(mediaM3U.get("mediaSequence"));
    if (error) {
      return generateErrorResponse(error);
    }

    const sourceBaseURL = path.dirname(event.queryStringParameters["url"]);
    const proxyManifest: string = manifestUtils.createProxyMediaManifest(mediaM3U, sourceBaseURL, allMutations);

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
    const errorRes: ServiceError = {
      status: 500,
      message: err.message ? err.message : err,
    };
    //för oväntade fel
    return generateErrorResponse(errorRes);
  }
}
