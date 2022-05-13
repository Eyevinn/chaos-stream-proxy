import { ServiceError, TargetIndex } from "../../shared/types";

// export type SegmentCorruptorConfigItem = {
//   index: TargetIndex;
//   seq: TargetIndex;
//   name: string;
//   queryValue: string;
// };

export interface SegmentCorruptorQueryConfig {
  /**
   * Tror vi måste vara tydliga att poängtera att det måste vara en JSON parseable string... vi kanske vill göra den validering i implementation, idk
   */
  getManifestConfigs: (urlValueString: string) => [ServiceError | null, CorruptorConfig[] | null];
  getSegmentConfigs(delayConfigString: string): [ServiceError | null, CorruptorConfig | null];
  name: string;
}

// TODO sequence might not be relevant as a generic property
export interface CorruptorConfig {
  i?: TargetIndex;
  sq?: TargetIndex;
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
  getAllManifestConfigs: (mseq?: number, isDash?: boolean) => [ServiceError | null, IndexedCorruptorConfigMap | null];

  getAllSegmentConfigs: () => [ServiceError | null, CorruptorConfigMap | null];

  /**
   * Registers a config. It can be any type that implements CorruptorConfig.
   */
  register: (config: SegmentCorruptorQueryConfig) => CorruptorConfigUtils;

  utils: {
    getJSONParseableString(value: string): string;
  };
}

export const corruptorConfigUtils = function (urlSearchParams: URLSearchParams): CorruptorConfigUtils {
  return Object.assign({
    utils: {
      getJSONParseableString(value: string): string {
        return decodeURIComponent(value)
          .replace(/\s/g, "")
          .replace(/({|,)(?:\s*)(?:')?([A-Za-z_$\.][A-Za-z0-9_ \-\.$]*)(?:')?(?:\s*):/g, '$1"$2":')
          .replace(/:\*/g, ':"*"');
      },
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
    getAllManifestConfigs(sourceMseq?: number, isDash?: boolean) {
      const mseq = sourceMseq || 0;
      const that: CorruptorConfigUtils = this;
      let outputMap = new Map<TargetIndex, Map<string, CorruptorConfig>>();

      if (!this.registered) {
        return [null, outputMap];
      }

      for (let i = 0; i < this.registered.length; i++) {
        const config: SegmentCorruptorQueryConfig = this.registered[i];

        if (!urlSearchParams.get(config.name)) {
          continue;
        }

        // JSONify and remove whitespace
        const parsedSearchParam = that.utils.getJSONParseableString(urlSearchParams.get(config.name));

        const [error, configList] = config.getManifestConfigs(parsedSearchParam);
        if (error) {
          return [error, null];
        }
        configList.forEach((item) => {
          if (!outputMap.get(item.i)) {
            outputMap.set(item.i, new Map<string, CorruptorConfig>());
          }
          // Only if we haven't already added a corruption for current index, we add it.
          if (!outputMap.get(item.i).get(config.name)) {
            outputMap.get(item.i).set(config.name, item);
          }

          if (isDash) {
            if (!outputMap.get(item.sq)) {
              const itemIdx = item.sq || item.i;
              if (typeof itemIdx === "number") {
                const itemIdx = item.sq || item.i;
                if (itemIdx === mseq) {
                  outputMap.set(itemIdx, new Map<string, CorruptorConfig>());
                  if (!outputMap.get(itemIdx).get(config.name)) {
                    outputMap.get(itemIdx).set(config.name, item);
                  }
                }
                
              } else if (itemIdx === "*") {
                outputMap.set(item.sq, new Map<string, CorruptorConfig>());
                if (!outputMap.get(item.sq).get(config.name)) {
                  outputMap.get(item.sq).set(config.name, item);
                }
              }
            }
          } else {
            // Handle if 'sq' is used instead.
            if (!outputMap.get(item.sq)) {
              if (typeof item.sq === "number") {
                const newIdx = item.sq - mseq;
                outputMap.set(newIdx, new Map<string, CorruptorConfig>());
                if (!outputMap.get(newIdx).get(config.name)) {
                  outputMap.get(newIdx).set(config.name, item);
                }
              } else if (item.sq === "*") {
                outputMap.set(item.sq, new Map<string, CorruptorConfig>());
                if (!outputMap.get(item.sq).get(config.name)) {
                  outputMap.get(item.sq).set(config.name, item);
                }
              }
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
        const that: CorruptorConfigUtils = this;
        if (urlSearchParams.get(SCC.name) !== null) {
          // To make all object key names double quoted and remove whitespace
          const parsedSearchParam = that.utils.getJSONParseableString(urlSearchParams.get(SCC.name));

          const [error, configResult] = SCC.getSegmentConfigs(parsedSearchParam); // should only contain 1 item this time
          if (error) {
            return [error, null];
          }
          outputMap.set(SCC.name, configResult);
        }
      }
      return [null, outputMap];
    },
  }) as CorruptorConfigUtils;
};
