import { ALBEvent, ALBResult } from "aws-lambda";
import fetch, { Response } from "node-fetch";
import { ServiceError } from "../../../shared/types";
import { generateErrorResponse, isValidUrl, SERVICE_ORIGIN } from "../../../shared/utils";
import delaySCC from "../../utils/corruptions/delay";
import statusCodeSCC from "../../utils/corruptions/statusCode";
import timeoutSCC from "../../utils/corruptions/timeout";
import path from "path";
import dashManifestUtils from "../../utils/dashManifestUtils";
import { corruptorConfigUtils } from "../../utils/configs";
import createProxyDASHManifest from "../../utils/dashManifestUtils";
import { isNumberObject } from "util/types";

export default async function dashHandler(event: ALBEvent ): Promise<ALBResult> {
  /**
   * #1 - const originalUrl = req.body.query("url");
   * #2 - const originalManifest = await fetch(originalUrl);
   * #3 - bygg proxy versionen och bygg responsen med rätt header
   */
  if (!event.queryStringParameters["url"] || !isValidUrl(event.queryStringParameters["url"])) {
    const errorRes: ServiceError = {
      status: 400,
      message: "Missing a valid 'url' query parameter",
    };
    return generateErrorResponse(errorRes);
  }

  try {
  
     const originalDashManifestResponse : Response = await fetch(event.queryStringParameters["url"]);
     const responseCopy = await originalDashManifestResponse.clone();
     if (!originalDashManifestResponse.ok) {
       const errorRes: ServiceError = {
         status: originalDashManifestResponse.status,
         message: "Unsuccessful Source Manifest fetch",
       };
       return generateErrorResponse(errorRes);
     }
    const reqQueryParams = new URLSearchParams(event.queryStringParameters);
    const text = await responseCopy.text();
    const proxyManifest = createProxyDASHManifest(text, reqQueryParams);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/dash+xml",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Origin",
      },
      body:  proxyManifest,
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
