import { Manifest } from "../../shared/types";
import { Response } from "node-fetch";
import * as xml2js from "xml2js";
import { IndexedCorruptorConfigMap } from "./configs";
import { proxyPathBuilder, segmentUrlParamString } from "../../shared/utils";


export default function createProxyDASHManifest(dashManifestText: String, originalUrlQuery: URLSearchParams): string {
    let manifest: string;
    const parser = new xml2js.Parser();
    const builder = new xml2js.Builder();


    let DASH_JSON;
    parser.parseString(dashManifestText, function (err, result) {
        DASH_JSON = result;
    });
    DASH_JSON["MPD"]["Period"].map((period) => {
        period["AdaptationSet"].map((adaptationSet) => {
            adaptationSet["Representation"].map((representation) => {
                if (representation.SegmentTemplate) {
                    representation.SegmentTemplate.map((segmentTemplate) => {
                        // Media attr.
                        const mediaUrl = segmentTemplate["$"]["media"];

                        segmentTemplate["$"]["media"] = proxyPathBuilder(mediaUrl, originalUrlQuery, "proxy-segment/segment_$Number$.mp4");
                        // Initialization attr.
                        const masterDashUrl = originalUrlQuery.get("url");
                        const initUrl = segmentTemplate["$"]["initialization"];
                        if (!initUrl.match(/^http/)) {
                            console.log("INIT URL IS: ",initUrl, 2000)
                            try {
                                const absoluteInitUrl = new URL(initUrl, masterDashUrl).href;
                                segmentTemplate["$"]["initialization"] = absoluteInitUrl;
                            } catch (e) {
                                console.log("error", e)
                                throw new Error(e);
                            }

                        }
                    });
                }
            });
        });
    });

    manifest = builder.buildObject(DASH_JSON);

    return manifest;
}

export async function createProxyDashRequest(resp: Response, orignialUrl: string, configsMap: IndexedCorruptorConfigMap): Promise<Manifest> {
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
                        const media = segmentTemplate["$"]["media"];
                        const params = segmentUrlParamString(segmentTemplate["$"]["media"], null);
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