/**
 * @jest-environment jsdom
 */
import hlsMasterHandler from "./master";
import nock from "nock";
import { ALBEvent, ALBResult } from "aws-lambda";
import { createReadStream, ReadStream } from "fs";
import path from "path";
import hlsMediaHandler from "./media";

describe.only("manifests.handlers.hls.media.ts", () => {
  describe.only("hlsMediaHandler", () => {
    let mockBaseURL: string;
    let mockMasterURL: string;
    let mockMediaURL: string;

    beforeEach(() => {
      mockBaseURL = "https://mock.mock.com/stream/hls";
      mockMasterURL = "https://mock.mock.com/stream/hls/manifest.m3u8";
      mockMediaURL = "https://mock.mock.com/stream/hls/manifest_1.m3u8";
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it("should return proxy media manifest with queryParams with corruption info on targeted Segment URLs", async () => {
      // Arrange
      const getMedia = () => {
        return new Promise((resolve, reject) => {
          const readStream: ReadStream = createReadStream(path.join(__dirname, `../../../testvectors/hls/hls2_multitrack/manifest_1.m3u8`));
          resolve(readStream);
        });
      };
      nock(mockBaseURL).persist().get("/manifest_1.m3u8").reply(200, getMedia, {
        "Content-Type": "application/x-mpegURL;charset=UTF-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Origin",
      });

      const queryParams = {
        url: mockMediaURL,
        statusCode: "[{i:2,code:400}]",
        delay: "[{i:1,ms:2000}]",
      };
      const event: ALBEvent = {
        requestContext: {
          elb: {
            targetGroupArn: "",
          },
        },
        path: "/stream/hls/manifest.m3u8",
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
      const response = await hlsMediaHandler(event);

      // Assert
      const expected: ALBResult = {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Headers": "Content-Type, Origin",
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/x-mpegURL",
        },
        body: `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:1
#EXT-X-PLAYLIST-TYPE:VOD
#EXTINF:10.0000,
https://mock.mock.com/stream/hls/manifest_1_00001.ts
#EXTINF:10.0000,
../../segments/proxy-segment?url=https%3A%2F%2Fmock.mock.com%2Fstream%2Fhls%2Fmanifest_1_00002.ts&delay=%7Bms%3A2000%7D
#EXTINF:10.0000,
../../segments/proxy-segment?url=https%3A%2F%2Fmock.mock.com%2Fstream%2Fhls%2Fmanifest_1_00003.ts&statusCode=%7Bcode%3A400%7D
#EXT-X-ENDLIST
`,
      };
      expect(response.statusCode).toEqual(expected.statusCode);
      expect(response.headers).toEqual(expected.headers);
      expect(response.body).toEqual(expected.body);
    });

    it("should return code 400 when 'url' query parameter is missing in request", async () => {
      // Arrange
      const queryParams = {
        statusCode: "[{i:2,code:400}]",
        delay: "[{i:1,ms:2000}]",
      };
      const event: ALBEvent = {
        requestContext: {
          elb: {
            targetGroupArn: "",
          },
        },
        path: "/stream/hls/manifest.m3u8",
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
      const response = await hlsMediaHandler(event);

      // Assert
      const expected: ALBResult = {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Headers": "Content-Type, Origin",
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      };
      expect(response.statusCode).toEqual(expected.statusCode);
      expect(response.headers).toEqual(expected.headers);
    });

    it("should return code 400 when 'url' query parameter is not a Valid URL", async () => {
      // Arrange
      const queryParams = {
        url: "not_a_valid_url.com/manifest.m3u8",
        statusCode: "[{i:2,code:400}]",
        delay: "[{i:1,ms:2000}]",
      };
      const event: ALBEvent = {
        requestContext: {
          elb: {
            targetGroupArn: "",
          },
        },
        path: "/stream/hls/manifest.m3u8",
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
      const response = await hlsMediaHandler(event);

      // Assert
      const expected: ALBResult = {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Headers": "Content-Type, Origin",
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      };
      expect(response.statusCode).toEqual(expected.statusCode);
      expect(response.headers).toEqual(expected.headers);
    });

    it("should pass-through status code from unsuccessful fetch of source Media manifest", async () => {
      // Arrange
      nock(mockBaseURL).persist().get("/manifest_1.m3u8").reply(404);

      const queryParams = {
        url: mockMediaURL,
        statusCode: "[{i:2,code:400}]",
        delay: "[{i:1,ms:2000}]",
      };
      const event: ALBEvent = {
        requestContext: {
          elb: {
            targetGroupArn: "",
          },
        },
        path: "/stream/hls/manifest_1.m3u8",
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
      const response = await hlsMediaHandler(event);

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

    it("should return code 500 on Other Errors, eg M3U8 parser error", async () => {});
  });
});
