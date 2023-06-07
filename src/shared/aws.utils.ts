import NodeCache from 'node-cache';
import SSM from 'aws-sdk/clients/ssm';
import dotenv from 'dotenv';
import { JwtToken } from './utils';
import { Context } from 'aws-lambda';
import { Jwt } from 'jsonwebtoken';
dotenv.config();

const IS_LAMBDA = !!process.env.LAMBDA_TASK_ROOT;

const ssm = new SSM({ region: process.env.AWS_REGION ?? 'eu-central-1' });
const cache = new NodeCache({ stdTTL: 60 });

export async function loadParameterFromSSMCached(
  parameterName: string
): Promise<string> {
  const cachedValue = cache.get(parameterName);

  if (cachedValue !== undefined) {
    return cachedValue.toString();
  }

  try {
    console.log('parameterName', parameterName);
    const response = await ssm.getParameter({ Name: parameterName }).promise();

    if (!response.Parameter || response.Parameter.Value === undefined) {
      throw new Error(
        `Parameter ${parameterName} not found in SSM Parameter Store`
      );
    }

    const value = response.Parameter.Value;
    cache.set(parameterName, value);

    return value;
  } catch (error) {
    console.log('SSM getParameter', error);
    return '';
  }
}

export function addSSMUrlParametersToUrl(url: string): Promise<string> {
  if (
    !url.includes('delay') &&
    !url.includes('statusCode') &&
    !url.includes('timeout') &&
    !url.includes('throttle') &&
    url.includes('proxy-master')
  ) {
    const parameterName =
      process.env.AWS_SSM_PARAM_KEY ??
      '/ChaosStreamProxy/Development/UrlParams';
    return new Promise((resolve, reject) => {
      loadParameterFromSSMCached(parameterName)
        .then((value) => {
          console.log(`The value of ${parameterName} is ${value}`);
          resolve(url + value);
        })
        .catch((error) => {
          console.log(`Error getting ${parameterName}: ${error}`);
          reject(error);
        });
    });
  } else {
    return Promise.resolve(url);
  }
}

type AwsLogLevel = 'DEBUG' | 'ERROR' | 'INFO' | 'TRACE';

type AwsLogMessage = string | object;

type AwsCloudwatchLog = {
  msg: AwsLogMessage;
  requestId: string;
  level: AwsLogLevel;
  user: JwtToken | undefined;
  time: Date;
};

export interface AwsLogger {
  info: (
    msg: AwsLogMessage,
    context: Context,
    user: JwtToken | undefined
  ) => void;
  debug: (
    msg: AwsLogMessage,
    context: Context,
    user: JwtToken | undefined
  ) => void;
  error: (
    msg: AwsLogMessage,
    context: Context,
    user: JwtToken | undefined
  ) => void;
  trace: (
    msg: AwsLogMessage,
    context: Context,
    user: JwtToken | undefined
  ) => void;
}

function awsLog(
  msg: AwsLogMessage,
  context: Context | undefined,
  user: JwtToken | undefined,
  level: AwsLogLevel
) {
  const log: AwsCloudwatchLog = {
    msg,
    requestId: context == undefined ? undefined : context.awsRequestId,
    user:
      user == undefined
        ? undefined
        : { email: user.email, company: user.company },
    level,
    time: new Date()
  };
  console.log(JSON.stringify(log));
}

export const awsLogger: AwsLogger = {
  info(msg, context, user) {
    awsLog(msg, context, user, 'INFO');
  },
  debug(msg, context, user) {
    awsLog(msg, context, user, 'DEBUG');
  },
  error(msg, context, user) {
    awsLog(msg, context, user, 'ERROR');
  },
  trace(msg, context, user) {
    awsLog(msg, context, user, 'TRACE');
  }
};
