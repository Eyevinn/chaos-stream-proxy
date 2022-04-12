import { FastifyReply, FastifyRequest } from "fastify";
import fetch, { Response } from "node-fetch";
import m3u8 from "@eyevinn/m3u8";
import { ALBHandler, ALBEvent, ALBResult } from "aws-lambda";
import { ServiceError, M3U } from "../../../shared/types";
import hlsManifestUtils from "../../utils/hlsManifestUtils";
import { isValidUrl, SERVICE_ORIGIN, parseM3U8Text, refineALBEventQuery, generateErrorResponse } from "../../../shared/utils";

// To be able to reuse the handlers for AWS lambda function - input should be ALBEvent
export default async function hlsMasterHandler(event: ALBEvent) {
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
    const originalMasterManifestResponse = await fetch(event.queryStringParameters["url"]);
    if (!originalMasterManifestResponse.ok) {
      const errorRes: ServiceError = {
        status: originalMasterManifestResponse.status,
        message: "Unsuccessful Source Manifest fetch",
      };
      return generateErrorResponse(errorRes);
    }
    const originalResHeaders = {};
    originalMasterManifestResponse.headers.forEach((value, key) => (originalResHeaders[key] = value));
    const masterM3U: M3U = await parseM3U8Text(originalMasterManifestResponse);

    // How to handle if M3U is actually a Media and Not a Master...
    if (masterM3U.items.PlaylistItem.length > 0) {
      const errorRes: ServiceError = {
        status: 400,
        message: "Input HLS stream URL is not a Multivariant Playlist",
      };
      return generateErrorResponse(errorRes);
    }

    const reqQueryParams = new URLSearchParams(event.queryStringParameters);

    const manifestUtils = hlsManifestUtils();

    const proxyManifest: string = manifestUtils.createProxyMasterManifest(masterM3U, reqQueryParams);

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
