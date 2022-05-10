import { Manifest } from "../../shared/types";
import { Response } from "node-fetch";
import * as xml2js from "xml2js";
import {IndexedCorruptorConfigMap } from "./configs";
import { proxyPathBuilder } from "../../shared/utils";

const cleanUpPathAndURI = (originPath: string, uri: string): string[] => {
    const matchList: string[] | null = uri.match(/\.\.\//g);
    if (matchList) {
        const jumpsToParentDir = matchList.length;
        if (jumpsToParentDir > 0) {
            let splitPath = originPath.split("/");
            for (let i = 0; i < jumpsToParentDir; i++) {
                splitPath.pop();
            }
            originPath = splitPath.join("/");
            let str2split = "";
            for (let i = 0; i < jumpsToParentDir; i++) {
             str2split += "../";
            }
            uri = uri.split(str2split).pop();
        }
    }
    return [originPath, uri];
};

 /* const signedDashMediaOriginURL = (mediaUrl: string, originPath: string): string => {
    const [_originPath, _uri] = cleanUpPathAndURI(ORIGIN + originPath, mediaUrl);
    let signedSearchParams: any = signUrlSearchParams(_originPath, _uri, getURLExpireTimeSec()).toString();
    const signedOriginURL = new URL(_originPath + "/" + _uri + "?" + signedSearchParams);
    return signedOriginURL.href;
  };*/

  export default async function createProxyDashRequest (resp: Response, orignialUrl: string, configsMap: IndexedCorruptorConfigMap): Promise<Manifest> {
    let manifest: string;
    const responseCopy = await resp.clone();
    const text = await responseCopy.text();
    console.log(text)
    const parser = new xml2js.Parser();
    const builder = new xml2js.Builder();
    

    let DASH_JSON;
    parser.parseString(text, function (err, result) {
        DASH_JSON = result;
    });
    DASH_JSON["MPD"]["Period"].map((period) => {
    period["AdaptationSet"].map((adaptationSet) => {
        adaptationSet["Representation"].map((representation) => {
        if (representation.SegmentTemplate) {
            representation.SegmentTemplate.map((segmentTemplate) => {
                console.log("segment", segmentTemplate["$"]["media"])
            // Media attr.
            const params = utils.segmentUrlParamString(sourceSegURL, corruption);
            segmentTemplate["$"]["media"] = proxyPathBuilder(segmentTemplate["$"]["media"], new URLSearchParams(params), "../../segments/proxy-segment");
            // Initialization attr.
            //segmentTemplate["$"]["initialization"] = signedDashMediaOriginURL(segmentTemplate["$"]["initialization"], signedOriginPath);
            });
        }
        });
    });
    });
    manifest = builder.buildObject(DASH_JSON);
    return manifest;
}