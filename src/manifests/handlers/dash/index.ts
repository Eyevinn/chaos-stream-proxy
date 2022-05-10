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
import createPoxyeDashRequest from "../../utils/dashManifestUtils";
import createProxyDashRequest from "../../utils/dashManifestUtils";

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
    console.log("url", event.queryStringParameters["url"])
    const originalDashManifestResponse : Response = await fetch(event.queryStringParameters["url"]);
    console.log("mani", originalDashManifestResponse)
    if (!originalDashManifestResponse.ok) {
      const errorRes: ServiceError = {
        status: originalDashManifestResponse.status,
        message: "Unsuccessful Source Manifest fetch",
      };
      return generateErrorResponse(errorRes);
    }
    const originalResHeaders = originalDashManifestResponse.headers;
    const reqQueryParams = new URLSearchParams(event.queryStringParameters);

    const configUtils = corruptorConfigUtils(reqQueryParams);
    configUtils.register(delaySCC).register(statusCodeSCC).register(timeoutSCC);

    // TODO: Fixa allt som behövs inför 'dashManifestHandlerUtils'

    /*const [error, allMutations] = configUtils.getAllManifestConfigs(mediaM3U.get("mediaSequence"));
    if (error) {
      return generateErrorResponse(error);
    }*/

    const sourceBaseURL = path.dirname(event.queryStringParameters["url"]);
    const [match, signedOriginPath] = event.path.match(/^(.*)\/(.*?)$/);
    console.log("signedpath", signedOriginPath)
    console.log("source base" , sourceBaseURL)
    const proxyManifest = createProxyDashRequest(originalDashManifestResponse, signedOriginPath, null);


    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/dash+xml",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Origin",
      },
      body: (await proxyManifest).toString(),
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
