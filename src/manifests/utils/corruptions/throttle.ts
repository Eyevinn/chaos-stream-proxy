import { unparsableError } from '../../../shared/utils';
import { ServiceError, TargetIndex } from '../../../shared/types';
import { CorruptorConfig, SegmentCorruptorQueryConfig } from '../configs';

interface ThrottleConfig extends CorruptorConfig {
  i?: TargetIndex;
  sq?: TargetIndex;
  br?: TargetIndex;
  rate?: number;
}

// TODO:Flytta till en i en constants fil, och gruppera med and
const throttleExpectedQueryFormatMsg =
  'Incorrect throttle query format. Expected format: [{i?:number, sq?:number, br?:number, rate:number}, ...n] where i and sq are mutually exclusive.';

function getManifestConfigError(value: { [key: string]: unknown }): string {
  const o = value as ThrottleConfig;

  if (o.rate && typeof o.rate !== 'number') {
    return throttleExpectedQueryFormatMsg;
  }

  if (o.i === undefined && o.sq === undefined) {
    return "Incorrect throttle query format. Either 'i' or 'sq' is required in a single query object.";
  }

  if (
    !(o.i === '*' || typeof o.i === 'number') &&
    !(o.sq === '*' || typeof o.sq === 'number')
  ) {
    return throttleExpectedQueryFormatMsg;
  }

  if (o.i !== undefined && o.sq !== undefined) {
    return "Incorrect throttle query format. 'i' and 'sq' are mutually exclusive in a single query object.";
  }

  if (Number(o.sq) < 0) {
    return 'Incorrect throttle query format. Field sq must be 0 or positive.';
  }

  if (Number(o.i) < 0) {
    return 'Incorrect throttle query format. Field i must be 0 or positive.';
  }

  return '';
}
function isValidSegmentConfig(value: { [key: string]: unknown }): boolean {
  if (value.rate && typeof value.rate !== 'number') {
    return false;
  }
  return true;
}

const throttleConfig: SegmentCorruptorQueryConfig = {
  getManifestConfigs(
    configs: Record<string, TargetIndex>[]
  ): [ServiceError | null, CorruptorConfig[] | null] {
    // Verify it's at least an array
    if (!Array.isArray(configs)) {
      return [
        {
          message: throttleExpectedQueryFormatMsg,
          status: 400
        },
        null
      ];
    }

    const configIndexMap = new Map<TargetIndex, CorruptorConfig>();
    const configSqMap = new Map<TargetIndex, CorruptorConfig>();

    for (const config of configs) {
      // Verify integrity of array content
      const error = getManifestConfigError(config);
      if (error) {
        return [{ message: error, status: 400 }, null];
      }

      const { rate, i, sq } = config;
      const fields = rate ? { rate } : null;

      // If * is already set, we skip
      if (!configIndexMap.has('*') && !configSqMap.has('*')) {
        // Index
        if (i === '*') {
          configIndexMap.set('*', { fields, i });
        }
        // Sequence
        else if (sq === '*') {
          configSqMap.set('*', { fields, sq });
        }
      }

      // Index numeric
      if (typeof i === 'number' && !configIndexMap.has(i)) {
        configIndexMap.set(i, { fields, i });
      }

      // Sequence numeric
      if (typeof sq === 'number' && !configSqMap.has(sq)) {
        configSqMap.set(sq, { fields, sq });
      }
    }

    const corruptorConfigs = [
      ...configIndexMap.values(),
      ...configSqMap.values()
    ];

    return [null, corruptorConfigs];
  },
  getSegmentConfigs(
    throttleConfigString: string
  ): [ServiceError | null, CorruptorConfig | null] {
    const config = JSON.parse(throttleConfigString);
    if (!isValidSegmentConfig(config)) {
      return [
        unparsableError(
          'throttle',
          throttleConfigString,
          '{i?:number, sq?:number, rate:number}'
        ),
        null
      ];
    }

    return [
      null,
      {
        i: config.i,
        sq: config.sq,
        fields: {
          rate: config.rate
        }
      }
    ];
  },
  name: 'throttle'
};

export default throttleConfig;
