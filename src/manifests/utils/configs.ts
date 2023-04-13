import { ServiceError, TargetIndex } from '../../shared/types';

// export type SegmentCorruptorConfigItem = {
//   index: TargetIndex;
//   seq: TargetIndex;
//   name: string;
//   queryValue: string;
// };

export interface SegmentCorruptorQueryConfig {
  getManifestConfigs: (
    config: Record<string, number | '*'>[]
  ) => [ServiceError | null, CorruptorConfig[] | null];
  getSegmentConfigs(
    delayConfigString: string
  ): [ServiceError | null, CorruptorConfig | null];
  name: string;
}

// TODO sequence might not be relevant as a generic property
export interface CorruptorConfig {
  i?: TargetIndex;
  sq?: TargetIndex;
  br?: TargetIndex;
  /**
   * - If fields is null, it means it's a no-op and ignored when parsing to query string
   * It's primarely used to indicate when the default * index operator should be overridden
   * with nothing.
   *
   * ex: ...&config=[{i:*, fields:{something:123}}, {i:0}] <-- index 0 will not get any config url query in the manifest.
   *
   * - If field is empty object {}, it will parse as follow:
   *
   * ex: ...&keyWithEmptyFields=&...
   */
  fields: { [key: string]: string | number | boolean } | null;
}

export type IndexedCorruptorConfigMap = Map<TargetIndex, CorruptorConfigMap>;

export type CorruptorConfigMap = Map<string, CorruptorConfig>;

export interface CorruptorConfigUtils {
  /**
   * Joins all registered query configurations (from /utils/corruptions/.. preferably)
   * into a map indexed by either a numeric index or a 'default' * operator.
   *
   * Value for each key is a map of all corruptions for selected index (eg key: "delay", value: {ms:150})
   */
  getAllManifestConfigs: (
    mseq?: number,
    isDash?: boolean
  ) => [ServiceError | null, IndexedCorruptorConfigMap | null];

  getAllSegmentConfigs: () => [ServiceError | null, CorruptorConfigMap | null];

  /**
   * Registers a config. It can be any type that implements CorruptorConfig.
   */
  register: (config: SegmentCorruptorQueryConfig) => CorruptorConfigUtils;

  utils: {
    getJSONParsableString(value: string): string;
  };
}

export class CorruptorIndexMap extends Map<TargetIndex, CorruptorConfigMap> {
  deepSet(
    index: TargetIndex,
    configName: string,
    value: CorruptorConfig,
    overwrite = true
  ) {
    if (!this.has(index)) {
      this.set(index, new Map());
    }
    const indexMap = this.get(index);
    if (overwrite || !indexMap.has(configName)) {
      indexMap.set(configName, value);
    }
  }
}

export const corruptorConfigUtils = function (
  urlSearchParams: URLSearchParams
): CorruptorConfigUtils {
  return Object.assign({
    utils: {
      getJSONParsableString(value: string): string {
        return decodeURIComponent(value)
          .replace(/\s/g, '')
          .replace(
            /({|,)(?:\s*)(?:')?([A-Za-z_$.][A-Za-z0-9_ \-.$]*)(?:')?(?:\s*):/g,
            '$1"$2":'
          )
          .replace(/:\*/g, ':"*"');
      }
    },
    register(config: SegmentCorruptorQueryConfig) {
      if (!this.registered) {
        this.registered = [];
      }
      if (config.name) {
        this.registered.push(config);
      }
      return this;
    },
    getAllManifestConfigs(mseq = 0, isDash = false) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const that: CorruptorConfigUtils = this;
      const outputMap = new CorruptorIndexMap();
      const configs = (
        (this.registered || []) as SegmentCorruptorQueryConfig[]
      ).filter(({ name }) => urlSearchParams.get(name));
      const segmentBitrate = Number(urlSearchParams.get('bitrate'));

      for (const config of configs) {
        // JSONify and remove whitespace
        const parsableSearchParam = that.utils.getJSONParsableString(
          urlSearchParams.get(config.name)
        );
        let params = JSON.parse(parsableSearchParam);

        // If bitrate is set, filter out segments that doesn't match
        if (Array.isArray(params)) {
          params = params.filter(
            (config) =>
              !config?.br || config?.br === '*' || config?.br === segmentBitrate
          );
        }

        const [error, configList] = config.getManifestConfigs(params);
        if (error) {
          return [error, null];
        }
        configList.forEach((item) => {
          if (item.i != undefined) {
            outputMap.deepSet(item.i, config.name, item, false);
          } else if (item.sq != undefined) {
            if (item.sq === '*' || (isDash && item.sq === mseq)) {
              outputMap.deepSet(item.sq, config.name, item, false);
            } else {
              outputMap.deepSet(item.sq - mseq, config.name, item, false);
            }
          }
        });
      }
      return [null, outputMap];
    },
    getAllSegmentConfigs() {
      const outputMap = new Map();
      for (let i = 0; i < this.registered.length; i++) {
        const SCC = this.registered[i];
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const that: CorruptorConfigUtils = this;
        if (urlSearchParams.get(SCC.name) !== null) {
          // To make all object key names double quoted and remove whitespace
          const parsedSearchParam = that.utils.getJSONParsableString(
            urlSearchParams.get(SCC.name)
          );

          const [error, configResult] =
            SCC.getSegmentConfigs(parsedSearchParam); // should only contain 1 item this time
          if (error) {
            return [error, null];
          }
          outputMap.set(SCC.name, configResult);
        }
      }
      return [null, outputMap];
    }
  }) as CorruptorConfigUtils;
};
