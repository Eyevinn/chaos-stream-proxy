import { ALBEvent, ALBResult } from "aws-lambda";
import { ServiceError } from "../../../shared/types";
import { convertToALBEvent, generateErrorResponse, isValidUrl, segmentUrlParamString } from "../../../shared/utils";
import delaySCC from "../../utils/corruptions/delay";
import statusCodeSCC from "../../utils/corruptions/statusCode";
import timeoutSCC from "../../utils/corruptions/timeout";
import path from "path";
import dashManifestUtils from "../../utils/dashManifestUtils";
import { corruptorConfigUtils } from "../../utils/configs";
import segmentHandler from "../../../segments/handlers/segment";
import { fileURLToPath } from "url";
import { url } from "inspector";


export default async function dashSegmentHandler(event: ALBEvent): Promise<ALBResult> {
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
        const urlSearchParams = new URLSearchParams(event.queryStringParameters);
        const mediaUrl = urlSearchParams.get("url");
        let pathtemp = path.basename(event.path);
        pathtemp = pathtemp.replace(".mp4", "");
        let index = 0
        for (let start = pathtemp.length - 1; start >= 0; start--) {
            if (!(parseInt(pathtemp[start]) >= 0)) {
                index = start + 1;
                break;
            }
        }

        const url = decodeURIComponent(event.queryStringParameters.toString());

        // Build correct Source Segment url
        const reqSegmentIndexStr = pathtemp.slice(index);
        const segmentUrl = mediaUrl.replace("$Number$", reqSegmentIndexStr);
        const reqSegmentIndexInt = parseInt(reqSegmentIndexStr);
        // Break down Corruption Objects
        // Send source URL with a corruption json (if it is appropriate) to segmentHandler...
        const reqQueryParams = new URLSearchParams(urlSearchParams);
        const configUtils = corruptorConfigUtils(reqQueryParams);
        configUtils.register(delaySCC).register(statusCodeSCC).register(timeoutSCC);
        const [error, allMutations] = configUtils.getAllManifestConfigs(reqSegmentIndexInt, true);
        if (error) {
            return generateErrorResponse(error);
        }
        const dashUtils = dashManifestUtils()
        let mergedMaps = dashUtils.utils.mergeMap(reqSegmentIndexInt, allMutations);
        const segUrl = new URL(segmentUrl);
        const cleanSegUrl = segUrl.origin + segUrl.pathname;
        let eventParamsString: string;
        if (mergedMaps.size < 1) {
            eventParamsString = `url=${cleanSegUrl}`;
        } else {
            eventParamsString = segmentUrlParamString(cleanSegUrl, mergedMaps);
        }
        let segmentHandlerEvent: ALBEvent = convertToALBEvent({
            method: event.httpMethod,
            headers: event.headers,
            url: `${event.path}?${eventParamsString}`
        });
        const response = await segmentHandler(segmentHandlerEvent);
        return response;

    } catch (err) {
        const errorRes: ServiceError = {
            status: 500,
            message: err.message ? err.message : err,
        };
        //för oväntade fel
        return generateErrorResponse(errorRes);
    }
}