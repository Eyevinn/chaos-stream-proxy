import { ALBEvent, ALBResult } from "aws-lambda";
import fetch from "node-fetch";
import { generateErrorResponse, isValidUrl } from "../../../shared/utils";
import dashManifestUtils from "../../utils/dashManifestUtils";

export default async function dashHandler(event: ALBEvent): Promise<ALBResult> {
  /**
   * #1 - const originalUrl = req.body.query("url");
   * #2 - const originalManifest = await fetch(originalUrl);
   * #3 - create proxy manifest and return response from it
   */
  const { url } = event.queryStringParameters;

  if (!url || !isValidUrl(url)) {
    return generateErrorResponse({
      status: 400,
      message: "Missing a valid 'url' query parameter",
    });
  }

  try {
     const originalDashManifestResponse = await fetch(url);
     const responseCopy = originalDashManifestResponse.clone();
     if (!originalDashManifestResponse.ok) {
       return generateErrorResponse({
        status: originalDashManifestResponse.status,
        message: "Unsuccessful Source Manifest fetch",
      });
     }
    const reqQueryParams = new URLSearchParams(event.queryStringParameters);
    const text = await responseCopy.text();
    const dashUtils = dashManifestUtils();
    const proxyManifest = dashUtils.createProxyDASHManifest(text, reqQueryParams);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/dash+xml",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Origin",
      },
      body: proxyManifest,
    };
  } catch (err) {
    // for unexpected errors
    return generateErrorResponse({
      status: 500,
      message: err.message || err,
    });
  }
}
