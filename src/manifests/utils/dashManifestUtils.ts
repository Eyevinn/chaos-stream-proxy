import { Manifest } from "../../shared/types";
import * as xml2js from "xml2js";
import { IndexedCorruptorConfigMap, CorruptorConfigMap } from "./configs";
import { proxyPathBuilder, segmentUrlParamString } from "../../shared/utils";

interface DASHManifestUtils {
    mergeMap: (segmentListSize: number, configsMap: IndexedCorruptorConfigMap) => CorruptorConfigMap;
}

export interface DASHManifestTools {
    createProxyDASHManifest: (dashManifestText: string, originalUrlQuery: URLSearchParams) => Manifest; // look def again
    utils: DASHManifestUtils;
}

export default function (): DASHManifestTools {
    const utils = Object.assign({
        mergeMap(targetSegmentIndex: number, configsMap: IndexedCorruptorConfigMap): CorruptorConfigMap {
            let outputMap = new Map();
            const d = configsMap.get("*");
            if (d) {
                for (let name of d.keys()) {
                    const { fields } = d.get(name);
                    outputMap.set(name, { fields: { ...fields } });
                }
            }
            // Populate any explicitly defined corruptions into the list
            const configCorruptions = configsMap.get(targetSegmentIndex);
            if (configCorruptions) {
                // Map values always take precedence
                for (let name of configCorruptions.keys()) {
                    // If fields isn't set, it means it's a skip if *, otherwise no-op
                    if (!configCorruptions.get(name).fields) {
                        outputMap.delete(name);
                        continue;
                    }
                    outputMap.set(name, configCorruptions.get(name));
                }
            }
            return outputMap;
        }
    })
    return Object.assign({
        utils,
        createProxyDASHManifest(dashManifestText: String, originalUrlQuery: URLSearchParams): string {
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
                                    try {
                                        const absoluteInitUrl = new URL(initUrl, masterDashUrl).href;
                                        segmentTemplate["$"]["initialization"] = absoluteInitUrl;
                                    } catch (e) {
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
    });
}
