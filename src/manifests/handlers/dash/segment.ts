import { ALBEvent, ALBResult } from "aws-lambda";
import fetch, { Response } from "node-fetch";
import { ServiceError } from "../../../shared/types";
import { convertToALBEvent, generateErrorResponse, isValidUrl, segmentUrlParamString } from "../../../shared/utils";
import delaySCC from "../../utils/corruptions/delay";
import statusCodeSCC from "../../utils/corruptions/statusCode";
import timeoutSCC from "../../utils/corruptions/timeout";
import path from "path";
import dashManifestUtils from "../../utils/dashManifestUtils";
import { corruptorConfigUtils, CorruptorConfigMap, IndexedCorruptorConfigMap } from "../../utils/configs";
import createProxyDASHManifest from "../../utils/dashManifestUtils";
import segmentHandler from "../../../segments/handlers/segment";
import { json } from "stream/consumers";


export default async function dashSegmentHandler(event: ALBEvent ): Promise<ALBResult> {

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
    
    let pathtemp = path.basename(event.path)
    pathtemp = pathtemp.replace(".mp4", "");
    let index = 0
    for (let start = pathtemp.length-1; start >= 0; start--) {
      if (!parseInt(pathtemp[start])) {
        index = start + 1;
        break;
      }
    } 
    // Build correct Source Segment url
    const reqSegmentIndex = pathtemp.slice(index);
    const segmentUrl = mediaUrl.replace("$Number$", reqSegmentIndex);

    // Break down Corruption Objects

    // Send source URL with a corruption json (if it is appropriate) to segmentHandler...

   
    const getJSONParseableString = (value: string): string => {
      return decodeURIComponent(value)
        .replace(/\s/g, "")
        .replace(/({|,)(?:\s*)(?:')?([A-Za-z_$\.][A-Za-z0-9_ \-\.$]*)(?:')?(?:\s*):/g, '$1"$2":')
        .replace(/:\*/g, ':"*"');
    }
    console.log("aefa2: ", getJSONParseableString(event.queryStringParameters['statusCode']))
    let eventQueryString = getJSONParseableString(urlSearchParams.toString()).replace(/\"i\"/g,"sq")
    console.log("aefa2 after : ", urlSearchParams.toString())
    console.log("aefa2 after : ", eventQueryString)
    const reqQueryParams = new URLSearchParams(eventQueryString);
    const configUtils = corruptorConfigUtils(reqQueryParams); //i => sq
    configUtils.register(delaySCC).register(statusCodeSCC).register(timeoutSCC);

    const [error, allMutations] = configUtils.getAllManifestConfigs(parseInt(reqSegmentIndex));
    if (error) {
      return generateErrorResponse(error);
    }
    console.log(allMutations, 1990);

    let reqSegmentCorruptions;

    const mergeMap = (seglemtListSize: number, configsMap: any): any[] => {
      const corruptions = [...new Array(seglemtListSize)].map((_, i) => {
        const d = configsMap.get("*");
        if (!d) {
          return null;
        }
        const c: any = new Map();
        for (let name of d.keys()) {
          const { fields } = d.get(name);
          c.set(name, { fields: { ...fields } });
        }

        return c;
      });

      // Populate any explicitly defined corruptions into the list
      for (let i = 0; i < corruptions.length; i++) {
        const configCorruptions = configsMap.get(i);

        if (configCorruptions) {
          // Map values always take precedence
          for (let name of configCorruptions.keys()) {
            if (!corruptions[i]) {
              corruptions[i] = new Map();
            }

            // If fields isn't set, it means it's a skip if *, otherwise no-op
            if (!configCorruptions.get(name).fields) {
              corruptions[i].delete(name);
              continue;
            }

            corruptions[i].set(name, configCorruptions.get(name));
          }
        }

        // If we nooped anything, let's make sure it's null
        if (!corruptions[i]?.size) {
          corruptions[i] = null;
        }
      }

      return corruptions;
    }

    /***
     * 
     * lentgh 1
     *  
     *  delay på i:1, i:3
     * status på i:1, i:3
     * 
     * [Map(1, {delay, statuscode})] 
     */
    let output = mergeMap(1,allMutations);
    let mymap = output.pop();
    console.log("current coruption on index ",mymap,reqSegmentIndex);
    reqSegmentCorruptions = mymap.get(parseInt(reqSegmentIndex));
    // if (!reqSegmentCorruptions) {
    //   reqSegmentCorruptions = allMutations.get('*');
    // } 
    //console.log("reqSegmentCorruptions----", reqSegmentCorruptions, reqSegmentIndex);
    let eventParamsString: string;
    if (!reqSegmentCorruptions) {
      eventParamsString = `url=${segmentUrl}`;
    } else {
      eventParamsString = segmentUrlParamString(segmentUrl, mymap);
    }


    let segmentHandlerEvent: ALBEvent = convertToALBEvent({
      method: event.httpMethod,
      headers: event.headers,
      url: `${event.path}?${eventParamsString}`
    });
    console.log("Gonna run segmentHandler", 1);
    const response = await segmentHandler(segmentHandlerEvent);
    console.log("completed segmentHandler", 2);
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