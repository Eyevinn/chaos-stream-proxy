import { ALBEvent, ALBResult } from 'aws-lambda';
import fetch from 'node-fetch';
import { generateErrorResponse, isValidUrl } from '../../../shared/utils';
import dashManifestUtils from '../../utils/dashManifestUtils';

export default async function dashHandler(event: ALBEvent): Promise<ALBResult> {
  /**
   * #1 - const originalUrl = req.body.query("url");
   * #2 - const originalManifest = await fetch(originalUrl);
   * #3 - create proxy manifest and return response from it
   */
  event.queryStringParameters.url = decodeURIComponent(event.queryStringParameters.url);
  const { url } = event.queryStringParameters;

  if (!url || !isValidUrl(url)) {
    return generateErrorResponse({
      status: 400,
      message: "Missing a valid 'url' query parameter"
    });
  }

  try {
    console.log(decodeURIComponent(url));
    const originalDashManifestResponse = await fetch(decodeURIComponent(url));
    console.log('bwallberg org🙌');
    if (!originalDashManifestResponse.ok) {
      return generateErrorResponse({
        status: originalDashManifestResponse.status,
        message: 'Unsuccessful Source Manifest fetch'
      });
    }
    const reqQueryParams = new URLSearchParams(event.queryStringParameters);

    console.log("bwallberg get text")
    const text = await originalDashManifestResponse.text();
    console.log("bwallberg got text")
    const dashUtils = dashManifestUtils();
    console.log("bwallberg got utils")
    const proxyManifest = dashUtils.createProxyDASHManifest(
      text,
      reqQueryParams
    );

    console.log("bwallberg wat")

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/dash+xml',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Origin'
      },
      body: proxyManifest
    };
  } catch (err) {
    console.error(err);
    // for unexpected errors
    return generateErrorResponse({
      status: 500,
      message: err.message || err
    });
  }
}
