/**
 * @jest-environment jsdom
 */
import hlsMasterHandler from "./master";
import nock from "nock";
import { ALBEvent, ALBResult } from "aws-lambda";
import { createReadStream, ReadStream } from "fs";
import path from "path";

describe("manifests.handlers.hls.master.ts", () => {
  describe("hlsMasterHandler", () => {
    let mockBaseURL: string;
    let mockMasterURL: string;
    beforeEach(() => {
      mockBaseURL = "https://mock.mock.com/stream/hls";
      mockMasterURL = "https://mock.mock.com/stream/hls/manifest.m3u8";
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it("should return proxy master manifest with queryParams on Media Playlist URLs", async () => {
      const getBody = () => {
        return new Promise((resolve, reject) => {
          const readStream: ReadStream = createReadStream(path.join(__dirname, "../../../testvectors/hls/hls1_multitrack/manifest.m3u8"));
          resolve(readStream);
        });
      };
      nock(mockBaseURL).persist().get("/manifest.m3u8").reply(200, getBody, {
        "Content-Type": "application/x-mpegURL;charset=UTF-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Origin",
      });

      // Arrange
      const queryParams = {
        url: mockMasterURL,
        statusCode: "[0;500, 1;400;50]",
        delay: "[0;150, 1;200;10, *;100]",
      };
      const event: ALBEvent = {
        requestContext: {
          elb: {
            targetGroupArn: "",
          },
        },
        path: "/stream/hls/master.m3u8",
        httpMethod: "GET",
        headers: {
          accept: "application/x-mpegURL;charset=UTF-8",
          "accept-language": "en-US,en;q=0.8",
          "content-type": "text/plain",
          host: "lambda-846800462-us-east-2.elb.amazonaws.com",
          "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6)",
          "x-amzn-trace-id": "Root=1-5bdb40ca-556d8b0c50dc66f0511bf520",
          "x-forwarded-for": "72.21.198.xx",
          "x-forwarded-port": "443",
          "x-forwarded-proto": "https",
        },
        isBase64Encoded: false,
        queryStringParameters: queryParams,
        body: "",
      };

      // Act
      const response = await hlsMasterHandler(event);

      // Assert
      const expected: ALBResult = {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Headers": "Content-Type, Origin",
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/x-mpegURL",
        },
        body: '{ status: "OK" }', // Add full m3u8 body?
      };
      expect(response.statusCode).toEqual(expected.statusCode);
      expect(response.headers).toEqual(expected.headers);
    });

    it("should return code 400 when 'url' query parameter is missing in request", async () => {
      const getBody = () => {
        return new Promise((resolve, reject) => {
          const readStream = createReadStream(path.join(__dirname, "../../../testvectors/hls/hls1_multitrack/manifest.m3u8"));
          resolve(readStream);
        });
      };
      nock(mockBaseURL).persist().get("/manifest.m3u8").reply(200, getBody, {
        "Content-Type": "application/x-mpegURL;charset=UTF-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Origin",
      });

      // Arrange
      const queryParams = {
        statusCode: "[0;500, 1;400;50]",
        delay: "[0;150, 1;200;10, *;100]",
      };
      const event: ALBEvent = {
        requestContext: {
          elb: {
            targetGroupArn: "",
          },
        },
        path: "/stream/hls/master.m3u8",
        httpMethod: "GET",
        headers: {
          accept: "application/x-mpegURL;charset=UTF-8",
          "accept-language": "en-US,en;q=0.8",
          "content-type": "text/plain",
          host: "lambda-846800462-us-east-2.elb.amazonaws.com",
          "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6)",
          "x-amzn-trace-id": "Root=1-5bdb40ca-556d8b0c50dc66f0511bf520",
          "x-forwarded-for": "72.21.198.xx",
          "x-forwarded-port": "443",
          "x-forwarded-proto": "https",
        },
        isBase64Encoded: false,
        queryStringParameters: queryParams,
        body: "",
      };

      // Act
      const response = await hlsMasterHandler(event);

      // Assert
      const expected: ALBResult = {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Headers": "Content-Type, Origin",
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: '{"reason":"Missing a valid \'url\' query parameter"}',
      };
      expect(response.statusCode).toEqual(expected.statusCode);
      expect(response.headers).toEqual(expected.headers);
      expect(response.body).toEqual(expected.body);
    });

    it("should return code 400 when 'url' query parameter is not a Valid URL", async () => {
      const getBody = () => {
        return new Promise((resolve, reject) => {
          const readStream = createReadStream(path.join(__dirname, "../../../testvectors/hls/hls1_multitrack/manifest.m3u8"));
          resolve(readStream);
        });
      };
      nock(mockBaseURL).persist().get("/manifest.m3u8").reply(200, getBody, {
        "Content-Type": "application/x-mpegURL;charset=UTF-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Origin",
      });

      // Arrange
      const queryParams = {
        url: "stream/hls/manifest.m3u8",
        statusCode: "[0;500, 1;400;50]",
        delay: "[0;150, 1;200;10, *;100]",
      };
      const event: ALBEvent = {
        requestContext: {
          elb: {
            targetGroupArn: "",
          },
        },
        path: "/stream/hls/master.m3u8",
        httpMethod: "GET",
        headers: {
          accept: "application/x-mpegURL;charset=UTF-8",
          "accept-language": "en-US,en;q=0.8",
          "content-type": "text/plain",
          host: "lambda-846800462-us-east-2.elb.amazonaws.com",
          "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6)",
          "x-amzn-trace-id": "Root=1-5bdb40ca-556d8b0c50dc66f0511bf520",
          "x-forwarded-for": "72.21.198.xx",
          "x-forwarded-port": "443",
          "x-forwarded-proto": "https",
        },
        isBase64Encoded: false,
        queryStringParameters: queryParams,
        body: "",
      };

      // Act
      const response = await hlsMasterHandler(event);

      // Assert
      const expected: ALBResult = {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Headers": "Content-Type, Origin",
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: '{"reason":"Missing a valid \'url\' query parameter"}',
      };
      expect(response.statusCode).toEqual(expected.statusCode);
      expect(response.headers).toEqual(expected.headers);
      expect(response.body).toEqual(expected.body);
    });

    it("should pass-through status code from unsuccessful fetch of source Master manifest", async () => {
      nock(mockBaseURL).persist().get("/manifest.m3u8").reply(404, null, {
        "Content-Type": "application/x-mpegURL;charset=UTF-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Origin",
      });

      // Arrange
      const queryParams = {
        url: mockMasterURL,
        statusCode: "[0;500, 1;400;50]",
        delay: "[0;150, 1;200;10, *;100]",
      };
      const event: ALBEvent = {
        requestContext: {
          elb: {
            targetGroupArn: "",
          },
        },
        path: "/stream/hls/master.m3u8",
        httpMethod: "GET",
        headers: {
          accept: "application/x-mpegURL;charset=UTF-8",
          "accept-language": "en-US,en;q=0.8",
          "content-type": "text/plain",
          host: "lambda-846800462-us-east-2.elb.amazonaws.com",
          "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6)",
          "x-amzn-trace-id": "Root=1-5bdb40ca-556d8b0c50dc66f0511bf520",
          "x-forwarded-for": "72.21.198.xx",
          "x-forwarded-port": "443",
          "x-forwarded-proto": "https",
        },
        isBase64Encoded: false,
        queryStringParameters: queryParams,
        body: "",
      };

      // Act
      const response = await hlsMasterHandler(event);

      // Assert
      const expected: ALBResult = {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Headers": "Content-Type, Origin",
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: '{"reason":"Unsuccessful Source Manifest fetch"}',
      };
      expect(response.statusCode).toEqual(expected.statusCode);
      expect(response.headers).toEqual(expected.headers);
      expect(response.body).toEqual(expected.body);
    });

    it("should return code 400 if source URL is a Media Playlist manifest", async () => {
      const getBody = () => {
        return new Promise((resolve, reject) => {
          const readStream = createReadStream(path.join(__dirname, "../../../testvectors/hls/hls1_multitrack/manifest_1.m3u8"));
          resolve(readStream);
        });
      };
      nock(mockBaseURL).persist().get("/manifest.m3u8").reply(200, getBody, {
        "Content-Type": "application/x-mpegURL;charset=UTF-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Origin",
      });

      // Arrange
      const queryParams = {
        url: mockMasterURL,
        statusCode: "[0;500, 1;400;50]",
        delay: "[0;150, 1;200;10, *;100]",
      };
      const event: ALBEvent = {
        requestContext: {
          elb: {
            targetGroupArn: "",
          },
        },
        path: "/stream/hls/master.m3u8",
        httpMethod: "GET",
        headers: {
          accept: "application/x-mpegURL;charset=UTF-8",
          "accept-language": "en-US,en;q=0.8",
          "content-type": "text/plain",
          host: "lambda-846800462-us-east-2.elb.amazonaws.com",
          "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6)",
          "x-amzn-trace-id": "Root=1-5bdb40ca-556d8b0c50dc66f0511bf520",
          "x-forwarded-for": "72.21.198.xx",
          "x-forwarded-port": "443",
          "x-forwarded-proto": "https",
        },
        isBase64Encoded: false,
        queryStringParameters: queryParams,
        body: "",
      };

      // Act
      const response = await hlsMasterHandler(event);

      // Assert
      const expected: ALBResult = {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Headers": "Content-Type, Origin",
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: '{"reason":"Input HLS stream URL is not a Multivariant Playlist"}',
      };
      expect(response.statusCode).toEqual(expected.statusCode);
      expect(response.headers).toEqual(expected.headers);
      expect(response.body).toEqual(expected.body);
    });

    it("should return code 500 on Other Errors, eg M3U8 parser error", async () => {
      nock(mockBaseURL).persist().get("/manifest.m3u8").reply(200, "{}", {
        "Content-Type": "application/x-mpegURL;charset=UTF-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Origin",
      });

      // Arrange
      const queryParams = {
        url: mockMasterURL,
        statusCode: "[0;500, 1;400;50]",
        delay: "[0;150, 1;200;10, *;100]",
      };
      const event: ALBEvent = {
        requestContext: {
          elb: {
            targetGroupArn: "",
          },
        },
        path: "/stream/hls/master.m3u8",
        httpMethod: "GET",
        headers: {
          accept: "application/x-mpegURL;charset=UTF-8",
          "accept-language": "en-US,en;q=0.8",
          "content-type": "text/plain",
          host: "lambda-846800462-us-east-2.elb.amazonaws.com",
          "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6)",
          "x-amzn-trace-id": "Root=1-5bdb40ca-556d8b0c50dc66f0511bf520",
          "x-forwarded-for": "72.21.198.xx",
          "x-forwarded-port": "443",
          "x-forwarded-proto": "https",
        },
        isBase64Encoded: false,
        queryStringParameters: queryParams,
        body: "",
      };

      // Act
      const response = await hlsMasterHandler(event);

      // Assert
      const expected: ALBResult = {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Headers": "Content-Type, Origin",
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: '{"reason":"Non-valid M3U file. First line: {}"}',
      };
      expect(response.statusCode).toEqual(expected.statusCode);
      expect(response.headers).toEqual(expected.headers);
      expect(response.body).toEqual(expected.body);
    });
  });
});
