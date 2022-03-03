"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nock_1 = __importDefault(require("nock"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const media_1 = __importDefault(require("./media"));
describe.only("manifests.handlers.hls.media.ts", () => {
    describe.only("hlsMediaHandler", () => {
        let mockBaseURL;
        let mockMasterURL;
        let mockMediaURL;
        beforeEach(() => {
            mockBaseURL = "https://mock.mock.com/stream/hls";
            mockMasterURL = "https://mock.mock.com/stream/hls/manifest.m3u8";
            mockMediaURL = "https://mock.mock.com/stream/hls/manifest_1.m3u8";
        });
        afterEach(() => {
            nock_1.default.cleanAll();
        });
        it("should return proxy media manifest with queryParams with corruption info on targeted Segment URLs", () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const getMedia = () => {
                return new Promise((resolve, reject) => {
                    const readStream = fs_1.createReadStream(path_1.default.join(__dirname, `../../../testvectors/hls/hls2_multitrack/manifest_1.m3u8`));
                    resolve(readStream);
                });
            };
            nock_1.default(mockBaseURL).persist().get("/manifest_1.m3u8").reply(200, getMedia, {
                "Content-Type": "application/x-mpegURL;charset=UTF-8",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type, Origin",
            });
            const queryParams = {
                url: mockMediaURL,
                statusCode: "[{i:2,code:400}]",
                delay: "[{i:1,ms:2000}]",
            };
            const event = {
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
            const response = yield media_1.default(event);
            // Assert
            const expected = {
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
        }));
        it("should return code 400 when 'url' query parameter is missing in request", () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const queryParams = {
                statusCode: "[{i:2,code:400}]",
                delay: "[{i:1,ms:2000}]",
            };
            const event = {
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
            const response = yield media_1.default(event);
            // Assert
            const expected = {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Headers": "Content-Type, Origin",
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json",
                },
            };
            expect(response.statusCode).toEqual(expected.statusCode);
            expect(response.headers).toEqual(expected.headers);
        }));
        it("should return code 400 when 'url' query parameter is not a Valid URL", () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const queryParams = {
                url: "not_a_valid_url.com/manifest.m3u8",
                statusCode: "[{i:2,code:400}]",
                delay: "[{i:1,ms:2000}]",
            };
            const event = {
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
            const response = yield media_1.default(event);
            // Assert
            const expected = {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Headers": "Content-Type, Origin",
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json",
                },
            };
            expect(response.statusCode).toEqual(expected.statusCode);
            expect(response.headers).toEqual(expected.headers);
        }));
        it("should pass-through status code from unsuccessful fetch of source Media manifest", () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            nock_1.default(mockBaseURL).persist().get("/manifest_1.m3u8").reply(404);
            const queryParams = {
                url: mockMediaURL,
                statusCode: "[{i:2,code:400}]",
                delay: "[{i:1,ms:2000}]",
            };
            const event = {
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
            const response = yield media_1.default(event);
            // Assert
            const expected = {
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
        }));
        it("should return code 500 on Other Errors, eg M3U8 parser error", () => __awaiter(void 0, void 0, void 0, function* () { }));
    });
});
//# sourceMappingURL=media.test.js.map