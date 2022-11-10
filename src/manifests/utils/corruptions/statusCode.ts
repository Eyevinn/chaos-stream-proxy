/* eslint-disable */
import { unparsableError } from "../../../shared/utils";
import { ServiceError, TargetIndex } from "../../../shared/types";
import { CorruptorConfig, SegmentCorruptorQueryConfig } from "../configs";

// TODO:Flytta till en i en constants fil, och gruppera med and
const statusCodeExpectedQueryFormatMsg = "Incorrect statusCode query format. Expected format: [{i?:number, sq?:number, code:number},...n] where i and sq are mutually exclusive.";

interface StatusCodeConfig {
  i?: TargetIndex;
  sq?: TargetIndex;
  ch?: number;
  code: number;
}

function getManifestConfigError(value: { [key: string]: any }): string {
  const o = value as StatusCodeConfig;
  if (o.code && typeof o.code !== "number") {
    return statusCodeExpectedQueryFormatMsg;
  }

  if (o.i === undefined && o.sq === undefined) {
    return "Incorrect statusCode query format. Either 'i' or 'sq' is required in a single query object.";
  }

  if (!(o.i === "*" || typeof o.i === "number") && !(o.sq === "*" || typeof o.sq === "number")) {
    return statusCodeExpectedQueryFormatMsg;
  }

  if (o.i !== undefined && o.sq !== undefined) {
    return "Incorrect statusCode query format. 'i' and 'sq' are mutually exclusive in a single query object.";
  }

  if (o.sq < 0) {
    return "Incorrect statusCode query format. Field sq must be 0 or positive.";
  }

  if (o.i < 0) {
    return "Incorrect statusCode query format. Field i must be 0 or positive.";
  }

  return "";
}
function isValidSegmentConfig(value: object): boolean {
  const o = value as StatusCodeConfig;
  if (o.code && typeof o.code !== "number") {
    return false;
  }
  return true;
}

const statusCodeConfig: SegmentCorruptorQueryConfig = {
  getManifestConfigs(statusCodeConfigString: string): [ServiceError | null, CorruptorConfig[] | null] {
    const configs: { [key: string]: any }[] = JSON.parse(statusCodeConfigString);
    // Verify it's at least an array
    if (!Array.isArray(configs)) {
      return [
        {
          message: statusCodeExpectedQueryFormatMsg,
          status: 400,
        },
        null,
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

    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      const corruptorConfig: CorruptorConfig = {
        fields: null,
      };

      if (config.code) {
        corruptorConfig.fields = {
          code: config.code,
        };
      }
      // Index default
      if (config.i === "*") {
        // If default is already set, we skip
        if (!configIndexMap.has(config.i) && !configSqMap.has(config.i)) {
          corruptorConfig.i = config.i;
          configIndexMap.set(config.i, corruptorConfig);
        }
      }

      // Index numeric
      if (typeof config.i === "number" && !configIndexMap.has(config.i)) {
        corruptorConfig.i = config.i;
        configIndexMap.set(config.i, corruptorConfig);
      }

      // Sequence default
      if (config.sq === "*") {
        // If default is already set, we skip
        if (!configIndexMap.has(config.sq) && !configSqMap.has(config.sq)) {
          corruptorConfig.sq = config.sq;
          configSqMap.set(config.sq, corruptorConfig);
        }
      }

      // Sequence numeric
      if (typeof config.sq === "number" && !configSqMap.has(config.sq)) {
        corruptorConfig.sq = config.sq;
        configSqMap.set(config.sq, corruptorConfig);
      }
    }

    const corruptorConfigs: CorruptorConfig[] = [];

    for (var value of configIndexMap.values()) {
      corruptorConfigs.push(value);
    }

    for (const value of configSqMap.values()) {
      corruptorConfigs.push(value);
    }
    return [null, corruptorConfigs];
  },
  getSegmentConfigs(satusCodeConfigString: string): [ServiceError | null, CorruptorConfig | null] {
    const config: any = JSON.parse(satusCodeConfigString);

    if (!isValidSegmentConfig(config)) {
      return [unparsableError("statusCode", satusCodeConfigString, "{i?:number, sq?:number, code:number}"), null];
    }
    return [
      null,
      {
        i: config.i,
        sq: config.sq,
        fields: {
          code: config.code,
        },
      },
    ];
  },
  name: "statusCode",
};

export default statusCodeConfig;
