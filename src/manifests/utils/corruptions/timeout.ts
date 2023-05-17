import { ServiceError, TargetIndex } from '../../../shared/types';
import { CorruptorConfig, SegmentCorruptorQueryConfig } from '../configs';

// TODO:Flytta till en i en constants fil, och gruppera med and
const timeoutExpectedQueryFormatMsg =
  'Incorrect timeout query format. Expected format: [{i?:number, sq?:number, br?:number}, ...n] where i and sq are mutually exclusive.';

interface TimeoutConfig {
  i?: TargetIndex;
  sq?: TargetIndex;
  br?: TargetIndex;
  ch?: number;
}

function getManifestConfigError(value: { [key: string]: unknown }): string {
  const o = value as TimeoutConfig;

  if (o.i === undefined && o.sq === undefined) {
    return "Incorrect timeout query format. Either 'i' or 'sq' is required in a single query object.";
  }

  if (
    !(o.i === '*' || typeof o.i === 'number') &&
    !(o.sq === '*' || typeof o.sq === 'number')
  ) {
    return timeoutExpectedQueryFormatMsg;
  }

  if (o.i !== undefined && o.sq !== undefined) {
    return "Incorrect timeout query format. 'i' and 'sq' are mutually exclusive in a single query object.";
  }

  if (Number(o.sq) < 0) {
    return 'Incorrect timeout query format. Field sq must be 0 or positive.';
  }

  if (Number(o.i) < 0) {
    return 'Incorrect timeout query format. Field i must be 0 or positive.';
  }

  return '';
}

const timeoutConfig: SegmentCorruptorQueryConfig = {
  getManifestConfigs(
    configs: Record<string, TargetIndex>[]
  ): [ServiceError | null, CorruptorConfig[] | null] {
    // Verify it's at least an array
    if (!Array.isArray(configs)) {
      return [
        {
          message: timeoutExpectedQueryFormatMsg,
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

    const configIndexMap = new Map<TargetIndex, CorruptorConfig>();
    const configSqMap = new Map();

    const noopNumericConfigs = function () {
      configIndexMap.forEach((val, key) => {
        if (typeof key === 'number') {
          val.fields = null;
          configIndexMap.set(key, val);
        }
      });

      configSqMap.forEach((val, key) => {
        if (typeof key === 'number') {
          val.fields = null;
          configSqMap.set(key, val);
        }
      });
    };

    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      const corruptorConfig: CorruptorConfig = {
        fields: {}
      };

      if (config.i === '*') {
        // If default is already set, we skip
        if (!configIndexMap.has(config.i) && !configSqMap.has(config.i)) {
          corruptorConfig.i = config.i;
          configIndexMap.set(config.i, corruptorConfig);

          // We need to noop all numeric
          noopNumericConfigs();
        }
      }

      if (typeof config.i === 'number') {
        // If there's any default, make it noop
        if (configIndexMap.has('*') || configSqMap.has('*')) {
          corruptorConfig.fields = null;
        }
        corruptorConfig.i = config.i;
        configIndexMap.set(config.i, corruptorConfig);
      }

      if (config.sq === '*') {
        // If default is already set, we skip
        if (!configIndexMap.has(config.sq) && !configSqMap.has(config.sq)) {
          corruptorConfig.sq = config.sq;
          configSqMap.set(config.sq, corruptorConfig);
        }

        // We need to noop all numbers
        noopNumericConfigs();
      }

      if (typeof config.sq === 'number') {
        // If there's any default, make it noop
        if (configIndexMap.has(config.i) || configSqMap.has(config.i)) {
          corruptorConfig.fields = null;
        }
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
    return [null, corruptorConfigs];
  },

  getSegmentConfigs(/* timeoutConfigString: string */): [
    ServiceError | null,
    CorruptorConfig | null
  ] {
    return [null, { fields: {} }];
  },
  name: 'timeout'
};

export default timeoutConfig;
