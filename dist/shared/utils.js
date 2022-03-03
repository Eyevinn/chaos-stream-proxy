"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERVICE_ORIGIN = exports.appendQueryParamsToItemURL = exports.refineALBEventQuery = exports.parseM3U8Stream = exports.parseM3U8Text = exports.unparseableError = exports.convertToALBEvent = exports.isValidUrl = exports.generateErrorResponse = exports.handleOptionsRequest = void 0;
const m3u8_1 = __importDefault(require("@eyevinn/m3u8"));
const clone_1 = __importDefault(require("clone"));
exports.handleOptionsRequest = (event) => __awaiter(void 0, void 0, void 0, function* () {
    return {
        statusCode: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Origin",
            "Access-Control-Max-Age": "86400",
        },
    };
});
exports.generateErrorResponse = (err) => {
    let response = {
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
exports.isValidUrl = (string) => {
    if (!string)
        return false;
    try {
        const url = decodeURIComponent(string);
        new URL(url); // eslint-disable-line
        return true;
    }
    catch (_) {
        return false;
    }
};
exports.convertToALBEvent = (req) => {
    // Create ABLEvent from Fastify Request...
    let params = {};
    const [path, queryString] = req.url.split("?");
    if (queryString) {
        for (let pair of queryString.split("&")) {
            const [k, v] = pair.split("=");
            params[k] = v;
        }
    }
    const event = {
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
exports.unparseableError = (name, unparseableQuery, format) => ({
    status: 400,
    message: `Incorrect ${name} value format at '${name}=${unparseableQuery}'. Must be: ${name}=${format}`,
});
function parseM3U8Text(res) {
    return __awaiter(this, void 0, void 0, function* () {
        /* [NOTE]
         Function handles case for when Media Playlist doesn't have the '#EXT-X-PLAYLIST-TYPE:VOD' tag,
         but is still a vod since it has the #EXT-X-ENDLIST tag.
         We set PLAYLIST-TYPE here if that is the case to ensure,
         that 'm3u.toString()' will later return a m3u8 string with the endlist tag.
        */
        let setPlaylistTypeToVod = false;
        const parser = m3u8_1.default.createStream();
        const responseCopy = yield res.clone();
        const m3u8String = yield responseCopy.text();
        if (m3u8String.indexOf("#EXT-X-ENDLIST") !== -1) {
            setPlaylistTypeToVod = true;
        }
        res.body.pipe(parser);
        return new Promise((resolve, reject) => {
            parser.on("m3u", (m3u) => {
                if (setPlaylistTypeToVod && m3u.get("playlistType") !== "VOD") {
                    m3u.set("playlistType", "VOD");
                }
                resolve(m3u);
            });
            parser.on("error", (err) => {
                reject(err);
            });
        });
    });
}
exports.parseM3U8Text = parseM3U8Text;
function parseM3U8Stream(stream) {
    const parser = m3u8_1.default.createStream();
    stream.pipe(parser);
    return new Promise((resolve, reject) => {
        parser.on("m3u", (m3u) => {
            resolve(m3u);
        });
        parser.on("error", (err) => {
            reject(err);
        });
    });
}
exports.parseM3U8Stream = parseM3U8Stream;
function refineALBEventQuery(originalQuery) {
    const queryStringParameters = clone_1.default(originalQuery);
    const searchParams = new URLSearchParams(Object.keys(queryStringParameters)
        .map((k) => `${k}=${queryStringParameters[k]}`)
        .join("&"));
    for (let k of searchParams.keys()) {
        queryStringParameters[k] = searchParams.get(k);
    }
    return queryStringParameters;
}
exports.refineALBEventQuery = refineALBEventQuery;
function appendQueryParamsToItemURL(item, originalQuery, itemUrlPrefix) {
    const allQueries = new URLSearchParams(originalQuery);
    let baseURL = "";
    // Bygg riktiga Media URL via riktiga Master URL
    const sourceURL = allQueries.get("url");
    const m = sourceURL === null || sourceURL === void 0 ? void 0 : sourceURL.match(/^(.*)\/.*?$/);
    if (m) {
        baseURL = m[1] + "/";
    }
    let sourceItemURL;
    if (item.get("uri").match(/^http/)) {
        sourceItemURL = item.get("uri");
    }
    else {
        sourceItemURL = baseURL + item.get("uri");
    }
    allQueries.set("url", sourceItemURL);
    // Släng på ny uppdaterad query string på det som stod.
    item.set("uri", itemUrlPrefix + "?" + allQueries.toString());
}
exports.appendQueryParamsToItemURL = appendQueryParamsToItemURL;
exports.SERVICE_ORIGIN = process.env.SERVICE_ORIGIN || "http://localhost:3000";
//# sourceMappingURL=utils.js.map