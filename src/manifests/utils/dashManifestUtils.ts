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

      let baseUrl;
      if (DASH_JSON.MPD.BaseURL) {
        // There should only ever be one baseurl according to schema
        baseUrl = DASH_JSON.MPD.BaseURL[0];
        // Remove base url from manifest since we are using relative paths for proxy
        DASH_JSON.MPD.BaseURL = [];
      }

      DASH_JSON.MPD.Period.map((period) => {
        period.AdaptationSet.map((adaptationSet) => {
          if (adaptationSet.SegmentTemplate) {
            // There should only be one segment template with this format
            const segmentTemplate = adaptationSet.SegmentTemplate[0];

            // Media attr
            const mediaUrl = segmentTemplate.$.media;
            // Clone params to avoid mutating input argument
            const urlQuery = new URLSearchParams(originalUrlQuery);

            // Convert relative segment offsets
            const duration = segmentTemplate.$.duration;
            const seconds_since_epoch = Math.round(new Date().getTime() / 1000);
            const start_segment_num = Math.round(
              seconds_since_epoch / Number(duration)
            );

            const status_code_obj = originalUrlQuery.get('statusCode');
            if (status_code_obj) {
              const status_code_conf = JSON.parse(
                getJSONParsableString(status_code_obj)
              );

              for (const scc of status_code_conf) {
                const sq_offset = scc['rsq'];
                if (sq_offset) {
                  delete scc['rsq'];
                  scc['sq'] = start_segment_num + sq_offset;
                }
              }
              const val = JSON.stringify(status_code_conf).replace(/"/g, '');
              urlQuery.set('statusCode', val);
            }

            segmentTemplate.$.media = proxyPathBuilder(
              mediaUrl.match(/^http/) ? mediaUrl : baseUrl + mediaUrl,
              urlQuery,
              'proxy-segment/segment_$Number$_$RepresentationID$_$Bandwidth$'
            );
            // Initialization attr.
            const initUrl = segmentTemplate.$.initialization;
            if (!initUrl.match(/^http/)) {
              try {
                // Use original query url if baseUrl is undefined, combine if relative, or use just baseUrl if its absolute
                if (!baseUrl) {
                  baseUrl = originalUrlQuery.get('url');
                } else if (!baseUrl.match(/^http/)) {
                  baseUrl = new URL(baseUrl, originalUrlQuery.get('url')).href;
                }
                const absoluteInitUrl = new URL(initUrl, baseUrl).href;
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

export function getJSONParsableString(value: string): string {
  return decodeURIComponent(value)
    .replace(/\s/g, '')
    .replace(
      /({|,)(?:\s*)(?:')?([A-Za-z_$.][A-Za-z0-9_ \-.$]*)(?:')?(?:\s*):/g,
      '$1"$2":'
    )
    .replace(/:\*/g, ':"*"');
}
