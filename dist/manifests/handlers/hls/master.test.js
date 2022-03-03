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
/**
 * @jest-environment jsdom
 */
const master_1 = __importDefault(require("./master"));
const nock_1 = __importDefault(require("nock"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
describe("manifests.handlers.hls.master.ts", () => {
    describe("hlsMasterHandler", () => {
        let mockBaseURL;
        let mockMasterURL;
        beforeEach(() => {
            mockBaseURL = "https://mock.mock.com/stream/hls";
            mockMasterURL = "https://mock.mock.com/stream/hls/manifest.m3u8";
        });
        afterEach(() => {
            nock_1.default.cleanAll();
        });
        it("should return proxy master manifest with queryParams on Media Playlist URLs", () => __awaiter(void 0, void 0, void 0, function* () {
            const getBody = () => {
                return new Promise((resolve, reject) => {
                    const readStream = fs_1.createReadStream(path_1.default.join(__dirname, "../../../testvectors/hls/hls1_multitrack/manifest.m3u8"));
                    resolve(readStream);
                });
            };
            nock_1.default(mockBaseURL).persist().get("/manifest.m3u8").reply(200, getBody, {
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
            const event = {
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
            const response = yield master_1.default(event);
            // Assert
            const expected = {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Headers": "Content-Type, Origin",
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/x-mpegURL",
                },
                body: '{ status: "OK" }',
            };
            expect(response.statusCode).toEqual(expected.statusCode);
            expect(response.headers).toEqual(expected.headers);
        }));
        it("should return code 400 when 'url' query parameter is missing in request", () => __awaiter(void 0, void 0, void 0, function* () {
            const getBody = () => {
                return new Promise((resolve, reject) => {
                    const readStream = fs_1.createReadStream(path_1.default.join(__dirname, "../../../testvectors/hls/hls1_multitrack/manifest.m3u8"));
                    resolve(readStream);
                });
            };
            nock_1.default(mockBaseURL).persist().get("/manifest.m3u8").reply(200, getBody, {
                "Content-Type": "application/x-mpegURL;charset=UTF-8",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type, Origin",
            });
            // Arrange
            const queryParams = {
                statusCode: "[0;500, 1;400;50]",
                delay: "[0;150, 1;200;10, *;100]",
            };
            const event = {
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
            const response = yield master_1.default(event);
            // Assert
            const expected = {
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
        }));
        it("should return code 400 when 'url' query parameter is not a Valid URL", () => __awaiter(void 0, void 0, void 0, function* () {
            const getBody = () => {
                return new Promise((resolve, reject) => {
                    const readStream = fs_1.createReadStream(path_1.default.join(__dirname, "../../../testvectors/hls/hls1_multitrack/manifest.m3u8"));
                    resolve(readStream);
                });
            };
            nock_1.default(mockBaseURL).persist().get("/manifest.m3u8").reply(200, getBody, {
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
            const event = {
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
            const response = yield master_1.default(event);
            // Assert
            const expected = {
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
        }));
        it("should pass-through status code from unsuccessful fetch of source Master manifest", () => __awaiter(void 0, void 0, void 0, function* () {
            nock_1.default(mockBaseURL).persist().get("/manifest.m3u8").reply(404, null, {
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
            const event = {
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
            const response = yield master_1.default(event);
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
        it("should return code 400 if source URL is a Media Playlist manifest", () => __awaiter(void 0, void 0, void 0, function* () {
            const getBody = () => {
                return new Promise((resolve, reject) => {
                    const readStream = fs_1.createReadStream(path_1.default.join(__dirname, "../../../testvectors/hls/hls1_multitrack/manifest_1.m3u8"));
                    resolve(readStream);
                });
            };
            nock_1.default(mockBaseURL).persist().get("/manifest.m3u8").reply(200, getBody, {
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
            const event = {
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
            const response = yield master_1.default(event);
            // Assert
            const expected = {
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
        }));
        it("should return code 500 on Other Errors, eg M3U8 parser error", () => __awaiter(void 0, void 0, void 0, function* () {
            nock_1.default(mockBaseURL).persist().get("/manifest.m3u8").reply(200, "{}", {
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
            const event = {
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
            const response = yield master_1.default(event);
            // Assert
            const expected = {
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
        }));
    });
});
//# sourceMappingURL=master.test.js.map