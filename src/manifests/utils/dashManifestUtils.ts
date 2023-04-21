import { Manifest } from '../../shared/types';
import * as xml2js from 'xml2js';
import { IndexedCorruptorConfigMap, CorruptorConfigMap } from './configs';
import { proxyPathBuilder } from '../../shared/utils';

interface DASHManifestUtils {
  mergeMap: (
    segmentListSize: number,
    configsMap: IndexedCorruptorConfigMap
  ) => CorruptorConfigMap;
}

export interface DASHManifestTools {
  createProxyDASHManifest: (
    dashManifestText: string,
    originalUrlQuery: URLSearchParams
  ) => Manifest; // look def again
  utils: DASHManifestUtils;
}

export default function (): DASHManifestTools {
  const utils = {
    mergeMap(
      targetSegmentIndex: number,
      configsMap: IndexedCorruptorConfigMap
    ): CorruptorConfigMap {
      const outputMap = new Map();
      const d = configsMap.get('*');
      if (d) {
        for (const name of d.keys()) {
          const { fields } = d.get(name);
          outputMap.set(name, { fields: { ...fields } });
        }
      }
      // Populate any explicitly defined corruptions into the list
      const configCorruptions = configsMap.get(targetSegmentIndex);
      if (configCorruptions) {
        // Map values always take precedence
        for (const name of configCorruptions.keys()) {
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
  };
  return {
    utils,
    createProxyDASHManifest(
      dashManifestText: string,
      originalUrlQuery: URLSearchParams
    ): string {
      const parser = new xml2js.Parser();
      const builder = new xml2js.Builder();

      let DASH_JSON;
      parser.parseString(dashManifestText, function (err, result) {
        DASH_JSON = result;
      });

      let oldBaseUrl;
      if (DASH_JSON.MPD.BaseURL) {
        oldBaseUrl = DASH_JSON.MPD.BaseURL;
        DASH_JSON.MPD.BaseURL =
          'http://localhost:8000/api/v2/manifests/dash/proxy-segment';
      }

      DASH_JSON.MPD.Period.map((period) => {
        period.AdaptationSet.map((adaptationSet) => {
          if (adaptationSet.SegmentTemplate) {
            // There should only be one segment template with this format
            const segmentTemplate = adaptationSet.SegmentTemplate[0];

            // Media attr
            const mediaUrl = segmentTemplate.$.media;
            const absoluteMediaUrl = new URL(mediaUrl, oldBaseUrl).href;
            // Clone params to avoid mutating input argument
            const urlQuery = new URLSearchParams(originalUrlQuery);

            segmentTemplate.$.media = proxyPathBuilder(
              absoluteMediaUrl,
              urlQuery,
              'proxy-segment/segment_$RepresentationID$-$Number$.m4s'
            );
            // Initialization attr.
            const initUrl = segmentTemplate.$.initialization;
            if (!initUrl.match(/^http/)) {
              try {
                // oldBaseUrl could be undefined, look into schema def for when its present for compressed format
                const absoluteInitUrl = new URL(initUrl, oldBaseUrl).href;
                segmentTemplate.$.initialization = absoluteInitUrl;
              } catch (e) {
                throw new Error(e);
              }
            }
          } else {
            // Uses segment ids
            adaptationSet.Representation.map((representation) => {
              if (representation.SegmentTemplate) {
                representation.SegmentTemplate.map((segmentTemplate) => {
                  // Media attr.
                  const mediaUrl = segmentTemplate.$.media;
                  // Clone params to avoid mutating input argument
                  const urlQuery = new URLSearchParams(originalUrlQuery);
                  if (representation.$.bandwidth) {
                    urlQuery.set('bitrate', representation.$.bandwidth);
                  }

                  segmentTemplate.$.media = proxyPathBuilder(
                    mediaUrl,
                    urlQuery,
                    'proxy-segment/segment_$Number$.mp4'
                  );
                  // Initialization attr.
                  const masterDashUrl = originalUrlQuery.get('url');
                  const initUrl = segmentTemplate.$.initialization;
                  if (!initUrl.match(/^http/)) {
                    try {
                      const absoluteInitUrl = new URL(initUrl, masterDashUrl)
                        .href;
                      segmentTemplate.$.initialization = absoluteInitUrl;
                    } catch (e) {
                      throw new Error(e);
                    }
                  }
                });
              }
            });
          }
        });
      });

      const manifest = builder.buildObject(DASH_JSON);

      return manifest;
    }
  };
}
