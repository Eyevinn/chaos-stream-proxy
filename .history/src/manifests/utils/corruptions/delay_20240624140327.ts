import { unparsableError } from '../../../shared/utils';
import { ServiceError, TargetIndex } from '../../../shared/types';
import { CorruptorConfig, SegmentCorruptorQueryConfig } from '../configs';

interface DelayConfig extends CorruptorConfig {
  ms?: number;
}

// TODO: Move to a constants file and group with and
const delayExpectedQueryFormatMsg =
  'Incorrect delay query format. Expected format: [{i?:number, l?:number, sq?:number, br?:number, ms:number}, ...n] where i and sq are mutually exclusive.';

function getManifestConfigError(value: { [key: string]: unknown }): string {
  const o = value as DelayConfig;

  if (o.ms && typeof o.ms !== 'number') {
    return delayExpectedQueryFormatMsg;
  }

  if (o.i === undefined && o.sq === undefined && o.l === undefined) {
    return "Incorrect delay query format. Either 'i', 'l' or 'sq' is required in a single query object.";
  }

  if (
    !(o.i === '*' || typeof o.i === 'number') &&
    !(o.sq === '*' || typeof o.sq === 'number') &&
    !(typeof o.l === 'number')
  ) {
    return delayExpectedQueryFormatMsg;
  }

  if (o.i !== undefined && o.sq !== undefined) {
    return "Incorrect delay query format. 'i' and 'sq' are mutually exclusive in a single query object.";
  }

  if (Number(o.sq) < 0) {
    return 'Incorrect delay query format. Field sq must be 0 or positive.';
  }

  if (Number(o.i) < 0) {
    return 'Incorrect delay query format. Field i must be 0 or positive.';
  }

  if (Number(o.l) < 0) {
    return 'Incorrect delay query format. Field l must be 0 or positive.';
  }

  return '';
}
function isValidSegmentConfig(value: { [key: string]: unknown }): boolean {
  if (value.ms && typeof value.ms !== 'number') {
    return false;
  }
  return true;
}

const delayConfig: SegmentCorruptorQueryConfig = {
  getManifestConfigs(
    configs: Record<string, TargetIndex>[]
  ): [ServiceError | null, CorruptorConfig[] | null] {
    // Verify it's at least an array
    if (!Array.isArray(configs)) {
      return [
        {
          message: delayExpectedQueryFormatMsg,
          status: 400
        },
        null
      ];
    }

    // Verify integrity of array content
    for (let i = 0; i < configs.length; i++) {
      const error = getManifestConfigError(configs[i]);
      if (error) {
        return [{ message: error, status: 400 }, null];
      }
    }

    const configIndexMap = new Map();
    const configSqMap = new Map();
    const configLevelMap = new Map();

    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      const corruptorConfig: CorruptorConfig = {
        fields: null
      };

      if (config.ms) {
        corruptorConfig.fields = {
          ms: config.ms
        };
      }

      // Index default
      if (config.i === '*') {
        // If default is already set, we skip
        if (!configIndexMap.has(config.i) && !configSqMap.has(config.i)) {
          corruptorConfig.i = config.i;
          configIndexMap.set(config.i, corruptorConfig);
          console.log(
            `Set delay configuration for index '*':`,
            corruptorConfig
          );
        }
      }

      // Index numeric
      if (typeof config.i === 'number' && !configIndexMap.has(config.i)) {
        corruptorConfig.i = config.i;
        configIndexMap.set(config.i, corruptorConfig);
      }

      // Level numeric
      if (typeof config.l === 'number' && !configLevelMap.has(config.l)) {
        corruptorConfig.l = config.l;
        configLevelMap.set(config.l, corruptorConfig);
      }

      // Sequence default
      if (config.sq === '*') {
        // If default is already set, we skip
        if (!configIndexMap.has(config.sq) && !configSqMap.has(config.sq)) {
          corruptorConfig.sq = config.sq;
          configSqMap.set(config.sq, corruptorConfig);
          console.log(
            `Set delay configuration for index '*':`,
            corruptorConfig
          );
        }
      }

      // Sequence numeric
      if (typeof config.sq === 'number' && !configSqMap.has(config.sq)) {
        corruptorConfig.sq = config.sq;
        configSqMap.set(config.sq, corruptorConfig);
      }
    }
    const corruptorConfigs: CorruptorConfig[] = [];

    for (const value of configIndexMap.values()) {
      corruptorConfigs.push(value);
    }

    for (const value of configSqMap.values()) {
      corruptorConfigs.push(value);
    }

    for (const value of configLevelMap.values()) {
      corruptorConfigs.push(value);
    }
    return [null, corruptorConfigs];
  },
  getSegmentConfigs(
    delayConfigString: string
  ): [ServiceError | null, CorruptorConfig | null] {
    const config = JSON.parse(delayConfigString);
    if (!isValidSegmentConfig(config)) {
      return [
        unparsableError(
          'delay',
          delayConfigString,
          '{i?:number, sq?:number, ms:number}'
        ),
        null
      ];
    }

    return [
      null,
      {
        i: config.i,
        l: config.l,
        sq: config.sq,
        fields: {
          ms: config.ms
        }
      }
    ];
  },
  name: 'delay'
};

export default delayConfig;
