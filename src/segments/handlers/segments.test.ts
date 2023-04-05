import { TargetIndex } from '../../shared/types';
import { parseM3U8Stream } from '../../shared/utils';
import { createReadStream } from 'fs';
import path from 'path';
import { ALBEvent, ALBResult } from 'aws-lambda';
import segmentHandler from './segment';

describe('segments.handlers.segment', () => {
  describe('segmentHandler', () => {
    it("should return code 400 when 'url' query parameter is missing in request", async () => {
      // Arrange
      const queryParams = {
        statusCode: '[{i:2,code:400}]',
        delay: '[{i:1,ms:2000}]'
      };
      const event: ALBEvent = {
        requestContext: {
          elb: {
            targetGroupArn: ''
          }
        },
        path: '/stream/hls/manifest.m3u8',
        httpMethod: 'GET',
        headers: {
          accept: 'application/x-mpegURL;charset=UTF-8',
          'accept-language': 'en-US,en;q=0.8',
          'content-type': 'text/plain',
          host: 'lambda-846800462-us-east-2.elb.amazonaws.com',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6)',
          'x-amzn-trace-id': 'Root=1-5bdb40ca-556d8b0c50dc66f0511bf520',
          'x-forwarded-for': '72.21.198.xx',
          'x-forwarded-port': '443',
          'x-forwarded-proto': 'https'
        },
        isBase64Encoded: false,
        queryStringParameters: queryParams,
        body: ''
      };

      // Act
      const response = await segmentHandler(event);

      // Assert
      const expected: ALBResult = {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Headers': 'Content-Type, Origin',
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: "Missing a valid 'url' query parameter"
        })
      };
      expect(response.statusCode).toEqual(expected.statusCode);
      expect(response.headers).toEqual(expected.headers);
      expect(response.body).toEqual(expected.body);
    });

    it("should return code 400 when 'url' query parameter is not a Valid URL", async () => {
      // Arrange
      const queryParams = {
        url: 'not_valid_url.com/segment_1.ts',
        statusCode: '[{i:2,code:400}]',
        delay: '[{i:1,ms:2000}]'
      };
      const event: ALBEvent = {
        requestContext: {
          elb: {
            targetGroupArn: ''
          }
        },
        path: '/stream/hls/manifest.m3u8',
        httpMethod: 'GET',
        headers: {
          accept: 'application/x-mpegURL;charset=UTF-8',
          'accept-language': 'en-US,en;q=0.8',
          'content-type': 'text/plain',
          host: 'lambda-846800462-us-east-2.elb.amazonaws.com',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6)',
          'x-amzn-trace-id': 'Root=1-5bdb40ca-556d8b0c50dc66f0511bf520',
          'x-forwarded-for': '72.21.198.xx',
          'x-forwarded-port': '443',
          'x-forwarded-proto': 'https'
        },
        isBase64Encoded: false,
        queryStringParameters: queryParams,
        body: ''
      };

      // Act
      const response = await segmentHandler(event);

      // Assert
      const expected: ALBResult = {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Headers': 'Content-Type, Origin',
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: "Missing a valid 'url' query parameter"
        })
      };
      expect(response.statusCode).toEqual(expected.statusCode);
      expect(response.headers).toEqual(expected.headers);
      expect(response.body).toEqual(expected.body);
    });

    it('should return code 400 when query parameter are not valid', async () => {
      // Arrange
      const queryParams = {
        url: 'http://mock.mock.com/segment_1.ts',
        delay: '{i:1,ms:"bad value"}'
      };
      const event: ALBEvent = {
        requestContext: {
          elb: {
            targetGroupArn: ''
          }
        },
        path: '/stream/hls/manifest.m3u8',
        httpMethod: 'GET',
        headers: {
          accept: 'application/x-mpegURL;charset=UTF-8',
          'accept-language': 'en-US,en;q=0.8',
          'content-type': 'text/plain',
          host: 'lambda-846800462-us-east-2.elb.amazonaws.com',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6)',
          'x-amzn-trace-id': 'Root=1-5bdb40ca-556d8b0c50dc66f0511bf520',
          'x-forwarded-for': '72.21.198.xx',
          'x-forwarded-port': '443',
          'x-forwarded-proto': 'https'
        },
        isBase64Encoded: false,
        queryStringParameters: queryParams,
        body: ''
      };

      // Act
      const response = await segmentHandler(event);

      // Assert
      const expected: ALBResult = {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Headers': 'Content-Type, Origin',
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: '{"reason":"Incorrect delay value format at \'delay={\\"i\\":1,\\"ms\\":\\"badvalue\\"}\'. Must be: delay={i?:number, sq?:number, ms:number}"}'
      };
      expect(response.statusCode).toEqual(expected.statusCode);
      expect(response.headers).toEqual(expected.headers);
      expect(response.body).toEqual(expected.body);
    });

    it('should return code 500 at unexpected error', async () => {
      // TODO
      expect(true).toEqual(true);
    });

    it('should return code 302 normally', async () => {
      // Arrange
      const queryParams = {
        url: 'http://mock.mock.com/segment_1.ts',
        delay: '{i:1,ms:20}'
      };
      const event: ALBEvent = {
        requestContext: {
          elb: {
            targetGroupArn: ''
          }
        },
        path: '/stream/hls/manifest.m3u8',
        httpMethod: 'GET',
        headers: {
          accept: 'application/x-mpegURL;charset=UTF-8',
          'accept-language': 'en-US,en;q=0.8',
          'content-type': 'text/plain',
          host: 'lambda-846800462-us-east-2.elb.amazonaws.com',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6)',
          'x-amzn-trace-id': 'Root=1-5bdb40ca-556d8b0c50dc66f0511bf520',
          'x-forwarded-for': '72.21.198.xx',
          'x-forwarded-port': '443',
          'x-forwarded-proto': 'https'
        },
        isBase64Encoded: false,
        queryStringParameters: queryParams,
        body: ''
      };

      // Act
      const response = await segmentHandler(event);

      // Assert
      const expected: ALBResult = {
        statusCode: 302,
        headers: {
          'Access-Control-Allow-Headers': 'Content-Type, Origin',
          'Access-Control-Allow-Origin': '*',
          Location: 'http://mock.mock.com/segment_1.ts'
        }
      };
      expect(response.statusCode).toEqual(expected.statusCode);
      expect(response.headers).toEqual(expected.headers);
    });

    it('should return code statusCode when doing status code corruption', async () => {
      // Arrange
      const queryParams = {
        url: 'http://mock.mock.com/segment_1.ts',
        statusCode: '{i:1,code:305}'
      };
      const event: ALBEvent = {
        requestContext: {
          elb: {
            targetGroupArn: ''
          }
        },
        path: '/stream/hls/manifest.m3u8',
        httpMethod: 'GET',
        headers: {
          accept: 'application/x-mpegURL;charset=UTF-8',
          'accept-language': 'en-US,en;q=0.8',
          'content-type': 'text/plain',
          host: 'lambda-846800462-us-east-2.elb.amazonaws.com',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6)',
          'x-amzn-trace-id': 'Root=1-5bdb40ca-556d8b0c50dc66f0511bf520',
          'x-forwarded-for': '72.21.198.xx',
          'x-forwarded-port': '443',
          'x-forwarded-proto': 'https'
        },
        isBase64Encoded: false,
        queryStringParameters: queryParams,
        body: ''
      };

      // Act
      const response = await segmentHandler(event);

      // Assert
      const expected: ALBResult = {
        statusCode: 305,
        headers: {
          'Access-Control-Allow-Headers': 'Content-Type, Origin',
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: '[Stream Corruptor]: Applied Status Code Corruption'
        })
      };
      expect(response.statusCode).toEqual(expected.statusCode);
      expect(response.headers).toEqual(expected.headers);
      expect(response.body).toEqual(expected.body);
    });
  });
});
