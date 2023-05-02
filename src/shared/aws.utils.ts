import NodeCache from 'node-cache';
import SSM from 'aws-sdk/clients/ssm';
import dotenv from 'dotenv';
dotenv.config();

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
