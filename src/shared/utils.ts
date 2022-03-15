import { Response } from "node-fetch";
import m3u8 from "@eyevinn/m3u8";
import { M3U, M3UItem, ServiceError } from "../shared/types";
import { FastifyRequest } from "fastify";
import clone from "clone";
import {
  ALBHandler,
  ALBEvent,
  ALBResult,
  ALBEventQueryStringParameters,
} from "aws-lambda";
import { ReadStream } from "fs";
import path from "path";

export const handleOptionsRequest = async (
  event: ALBEvent
): Promise<ALBResult> => {
  return {
    statusCode: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Origin",
      "Access-Control-Max-Age": "86400",
    },
  };
};

export const generateErrorResponse = (
  err: ServiceError
): Promise<ALBResult> => {
  let response: ALBResult = {
    statusCode: err.status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Origin",
    },
  };
  response.body = JSON.stringify({ reason: err.message });

  return Promise.resolve(response);
};

export const isValidUrl = (string) => {
  if (!string) return false;
  try {
    const url = decodeURIComponent(string);
    new URL(url); // eslint-disable-line

    return true;
  } catch (_) {
    return false;
  }
};

export const convertToALBEvent = (req) => {
  // Create ABLEvent from Fastify Request...
  let params = {};
  const [path, queryString] = req.url.split("?");
  if (queryString) {
    for (let pair of queryString.split("&")) {
      const [k, v] = pair.split("=");
      params[k] = v;
    }
  }
  const event: ALBEvent = {
    requestContext: {
      elb: {
        targetGroupArn: "",
      },
    },
    path: path,
    httpMethod: req.method,
    headers: req.headers,
    queryStringParameters: params,
    body: "",
    isBase64Encoded: false,
  };
  return event;
};

export const unparseableError = (
  name: string,
  unparseableQuery: string,
  format: string
) => ({
  status: 400,
  message: `Incorrect ${name} value format at '${name}=${unparseableQuery}'. Must be: ${name}=${format}`,
});

export async function parseM3U8Text(res: Response): Promise<M3U> {
  /* [NOTE] 
   Function handles case for when Media Playlist doesn't have the '#EXT-X-PLAYLIST-TYPE:VOD' tag,
   but is still a vod since it has the #EXT-X-ENDLIST tag.
   We set PLAYLIST-TYPE here if that is the case to ensure,
   that 'm3u.toString()' will later return a m3u8 string with the endlist tag.
  */
  let setPlaylistTypeToVod: boolean = false;
  const parser = m3u8.createStream();
  const responseCopy = await res.clone();
  const m3u8String = await responseCopy.text();
  if (m3u8String.indexOf("#EXT-X-ENDLIST") !== -1) {
    setPlaylistTypeToVod = true;
  }
  res.body.pipe(parser);
  return new Promise<any>((resolve, reject) => {
    parser.on("m3u", (m3u: M3U) => {
      if (setPlaylistTypeToVod && m3u.get("playlistType") !== "VOD") {
        m3u.set("playlistType", "VOD");
      }
      resolve(m3u);
    });
    parser.on("error", (err) => {
      reject(err);
    });
  });
}

export function parseM3U8Stream(stream: ReadStream): Promise<M3U> {
  const parser = m3u8.createStream();
  stream.pipe(parser);
  return new Promise<M3U>((resolve, reject) => {
    parser.on("m3u", (m3u: M3U) => {
      resolve(m3u);
    });
    parser.on("error", (err) => {
      reject(err);
    });
  });
}

export function refineALBEventQuery(
  originalQuery: ALBEventQueryStringParameters
) {
  const queryStringParameters = clone(originalQuery);
  const searchParams = new URLSearchParams(
    Object.keys(queryStringParameters)
      .map((k) => `${k}=${queryStringParameters[k]}`)
      .join("&")
  );
  for (let k of searchParams.keys()) {
    queryStringParameters[k] = searchParams.get(k);
  }
  return queryStringParameters;
}

type ProxyBasenames = "proxy-media" | "../../segments/proxy-segment";

export function proxyPathBuilder(
  itemUri: string,
  urlSearchParams: URLSearchParams,
  proxy: ProxyBasenames
): string {
  const allQueries = new URLSearchParams(urlSearchParams);

  const sourceURL = allQueries.get("url");

  let baseURL: string = path.basename(sourceURL) + "/";

  // const m = sourceURL?.match(/^(.*)\/.*?$/);
  // if (m && m.length > 1) {
  //   baseURL = m[1] + "/";
  // }

  let sourceItemURL: string = itemUri.match(/^http/)
    ? itemUri
    : baseURL + itemUri;

  if (sourceItemURL) {
    allQueries.set("url", sourceItemURL);
  }

  const allQueriesString = allQueries.toString();

  return `${proxy}${allQueriesString ? `?${allQueriesString}` : ""}`;
}

export const SERVICE_ORIGIN =
  process.env.SERVICE_ORIGIN || "http://localhost:3000";
