import { Response } from "node-fetch";
import m3u8 from "@eyevinn/m3u8";
import { M3U, ServiceError } from "../shared/types";
import { FastifyRequest } from "fastify";
import clone from "clone";
import { ALBHandler, ALBEvent, ALBResult, ALBEventQueryStringParameters } from "aws-lambda";
import { ReadStream } from "fs";

export const handleOptionsRequest = async (event: ALBEvent): Promise<ALBResult> => {
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

export const generateErrorResponse = (err: ServiceError): Promise<ALBResult> => {
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

export const unparseableError = (name: string, unparseableQuery: string, format: string) => ({
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

export function refineALBEventQuery(originalQuery: ALBEventQueryStringParameters) {
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

export function appendQueryParamsToItemURL(item: any, originalQuery: URLSearchParams, itemUrlPrefix: string): void {
  const allQueries = new URLSearchParams(originalQuery);
  let baseURL: string = "";
  // Bygg riktiga Media URL via riktiga Master URL
  const sourceURL = allQueries.get("url");
  const m: any = sourceURL?.match(/^(.*)\/.*?$/);
  if (m) {
    baseURL = m[1] + "/";
  }
  let sourceItemURL: string;
  if (item.get("uri").match(/^http/)) {
    sourceItemURL = item.get("uri");
  } else {
    sourceItemURL = baseURL + item.get("uri");
  }
  allQueries.set("url", sourceItemURL);
  // Släng på ny uppdaterad query string på det som stod.
  item.set("uri", itemUrlPrefix + "?" + allQueries.toString());
}

export const SERVICE_ORIGIN = process.env.SERVICE_ORIGIN || "http://localhost:3000";
