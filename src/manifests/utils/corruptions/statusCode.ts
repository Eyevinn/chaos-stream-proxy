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
  return typeof (value as StatusCodeConfig)?.code === "number";
}

const statusCodeConfig: SegmentCorruptorQueryConfig = {
  getManifestConfigs(configs: Record<string, TargetIndex>[]): [ServiceError | null, CorruptorConfig[] | null] {
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

    const configIndexMap = new Map<TargetIndex, CorruptorConfig>();
    const configSqMap = new Map<TargetIndex, CorruptorConfig>();

    for (const config of configs) {
      // Verify integrity of array content
      const error = getManifestConfigError(config);
      if (error) {
        return [{ message: error, status: 400 }, null];
      }

      const { code, i, sq } = config;
      const fields = code ? { code } : null;

      // If * is already set, we skip
      if (!configIndexMap.has("*") && !configSqMap.has("*")) {
        // Index
        if (i === "*") {
          configIndexMap.set("*", { fields, i });
        }
        // Sequence
        else if (sq === "*") {
          configSqMap.set("*", { fields, sq });
        }
      }

      // Index numeric
      if (typeof i === "number" && !configIndexMap.has(i)) {
        configIndexMap.set(i, { fields, i });
      }

      // Sequence numeric
      if (typeof sq === "number" && !configSqMap.has(sq)) {
        configSqMap.set(sq, { fields, sq });
      }
    }

    const corruptorConfigs = [
      ...configIndexMap.values(),
      ...configSqMap.values(),
    ];

    return [null, corruptorConfigs];
  },
  getSegmentConfigs(statusCodeConfigString: string): [ServiceError | null, CorruptorConfig | null] {
    const config = JSON.parse(statusCodeConfigString);

    if (!isValidSegmentConfig(config)) {
      return [
        unparsableError(
          "statusCode",
          statusCodeConfigString,
          "{i?:number, sq?:number, code:number}"
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
          code: config.code,
        },
      },
    ];
  },
  name: "statusCode",
};

export default statusCodeConfig;
