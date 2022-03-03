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
const utils_1 = require("../../shared/utils");
const configs_1 = require("./configs");
const hlsManifestUtils_1 = __importDefault(require("./hlsManifestUtils"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const hlsManifestUtils_2 = __importDefault(require("./hlsManifestUtils"));
describe("hlsManifestTools", () => {
    describe("createProxyMasterManifest", () => {
        it("should replace variant urls in Master manifest, with querystring and swap 'url' value with source media url", () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const readStream = fs_1.createReadStream(path_1.default.join(__dirname, "../../testvectors/hls/hls1_multitrack/manifest.m3u8"));
            const masterM3U = yield utils_1.parseM3U8Stream(readStream);
            const queryString = "url=https://mock.mock.com/stream/hls/manifest.m3u8&statusCode=[{i:0,code:404},{i:2,code:401}]&timeout=[{i:3}]&delay=[{i:2,ms:2000}]";
            const urlSearchParams = new URLSearchParams(queryString);
            // Act
            const manifestUtils = hlsManifestUtils_2.default();
            const proxyManifest = manifestUtils.createProxyMasterManifest(masterM3U, urlSearchParams);
            // Assert
            const expected = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-STREAM-INF:BANDWIDTH=4255267,AVERAGE-BANDWIDTH=4255267,CODECS="avc1.4d4032,mp4a.40.2",RESOLUTION=2560x1440,FRAME-RATE=25,AUDIO="audio",SUBTITLES="subs"
proxy-media?url=https%3A%2F%2Fmock.mock.com%2Fstream%2Fhls%2Fmanifest_1.m3u8&statusCode=%5B%7Bi%3A0%2Ccode%3A404%7D%2C%7Bi%3A2%2Ccode%3A401%7D%5D&timeout=%5B%7Bi%3A3%7D%5D&delay=%5B%7Bi%3A2%2Cms%3A2000%7D%5D
#EXT-X-STREAM-INF:BANDWIDTH=3062896,AVERAGE-BANDWIDTH=3062896,CODECS="avc1.4d4028,mp4a.40.2",RESOLUTION=1920x1080,FRAME-RATE=25,AUDIO="audio",SUBTITLES="subs"
proxy-media?url=https%3A%2F%2Fmock.mock.com%2Fstream%2Fhls%2Fmanifest_2.m3u8&statusCode=%5B%7Bi%3A0%2Ccode%3A404%7D%2C%7Bi%3A2%2Ccode%3A401%7D%5D&timeout=%5B%7Bi%3A3%7D%5D&delay=%5B%7Bi%3A2%2Cms%3A2000%7D%5D
#EXT-X-STREAM-INF:BANDWIDTH=2316761,AVERAGE-BANDWIDTH=2316761,CODECS="avc1.4d4028,mp4a.40.2",RESOLUTION=1920x1080,FRAME-RATE=25,AUDIO="audio",SUBTITLES="subs"
proxy-media?url=https%3A%2F%2Fmock.mock.com%2Fstream%2Fhls%2Fmanifest_3.m3u8&statusCode=%5B%7Bi%3A0%2Ccode%3A404%7D%2C%7Bi%3A2%2Ccode%3A401%7D%5D&timeout=%5B%7Bi%3A3%7D%5D&delay=%5B%7Bi%3A2%2Cms%3A2000%7D%5D

#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",LANGUAGE="en",NAME="English stereo",CHANNELS="2",DEFAULT=YES,AUTOSELECT=YES,URI="proxy-media?url=https%3A%2F%2Fmock.mock.com%2Fstream%2Fhls%2Fmanifest_audio-en.m3u8&statusCode=%5B%7Bi%3A0%2Ccode%3A404%7D%2C%7Bi%3A2%2Ccode%3A401%7D%5D&timeout=%5B%7Bi%3A3%7D%5D&delay=%5B%7Bi%3A2%2Cms%3A2000%7D%5D"
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",LANGUAGE="sv",NAME="Swedish stereo",CHANNELS="2",DEFAULT=NO,AUTOSELECT=YES,URI="proxy-media?url=https%3A%2F%2Fmock.mock.com%2Fstream%2Fhls%2Fmanifest_audio-sv.m3u8&statusCode=%5B%7Bi%3A0%2Ccode%3A404%7D%2C%7Bi%3A2%2Ccode%3A401%7D%5D&timeout=%5B%7Bi%3A3%7D%5D&delay=%5B%7Bi%3A2%2Cms%3A2000%7D%5D"
#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",LANGUAGE="en",NAME="English",FORCED=NO,DEFAULT=NO,AUTOSELECT=YES,URI="proxy-media?url=https%3A%2F%2Fmock.mock.com%2Fstream%2Fhls%2Fmanifest_subs-en.m3u8&statusCode=%5B%7Bi%3A0%2Ccode%3A404%7D%2C%7Bi%3A2%2Ccode%3A401%7D%5D&timeout=%5B%7Bi%3A3%7D%5D&delay=%5B%7Bi%3A2%2Cms%3A2000%7D%5D"

`;
            expect(proxyManifest).toEqual(expected);
        }));
    });
    describe("createProxyMediaManifest", () => {
        it("should replace segment urls in Media manifest, with querystring and swap 'url' value with source segment url", () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const mockCorruptionName = "_test_";
            const readStream = fs_1.createReadStream(path_1.default.join(__dirname, "../../testvectors/hls/hls1_multitrack/manifest_1.m3u8"));
            const mediaM3U = yield utils_1.parseM3U8Stream(readStream);
            const mockBaseUrl = "https://mock.mock.com/stream/hls";
            const queryString = `url=${mockBaseUrl}/manifest_1.m3u8&${mockCorruptionName}=[{i:0,key:404},{i:2,key:401}]`;
            const urlSearchParams = new URLSearchParams(queryString);
            const configs = configs_1.corruptorConfigUtils(urlSearchParams);
            const config = {
                name: mockCorruptionName,
                getManifestConfigs: () => [
                    null,
                    [
                        { i: 0, fields: { key: 404 } },
                        { i: 2, fields: { key: 401 } },
                    ],
                ],
                getSegmentConfigs: () => [null, { fields: null }],
            };
            configs.register(config);
            const [error, allMutations] = configs.getAllManifestConfigs(mediaM3U.get("mediaSequence"));
            // Act
            const manifestUtils = hlsManifestUtils_2.default();
            const proxyManifest = manifestUtils.createProxyMediaManifest(mediaM3U, mockBaseUrl, allMutations);
            // Assert
            const expected = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:1
#EXT-X-PLAYLIST-TYPE:VOD
#EXTINF:10.0000,
../../segments/proxy-segment?url=https%3A%2F%2Fmock.mock.com%2Fstream%2Fhls%2Fmanifest_1_00001.ts&_test_=%7Bkey%3A404%7D
#EXTINF:10.0000,
https://mock.mock.com/stream/hls/manifest_1_00002.ts
#EXTINF:10.0000,
../../segments/proxy-segment?url=https%3A%2F%2Fmock.mock.com%2Fstream%2Fhls%2Fmanifest_1_00003.ts&_test_=%7Bkey%3A401%7D
#EXT-X-ENDLIST
`;
            expect(proxyManifest).toEqual(expected);
        }));
        it("should replace segment urls in Media manifest, with querystring and swap 'url' value with source segment url, except for targeted noop indexes", () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const mockCorruptionName = "_test_";
            const readStream = fs_1.createReadStream(path_1.default.join(__dirname, "../../testvectors/hls/hls1_multitrack/manifest_1.m3u8"));
            const mediaM3U = yield utils_1.parseM3U8Stream(readStream);
            const mockBaseUrl = "https://mock.mock.com/stream/hls";
            const queryString = `url=${mockBaseUrl}/manifest_1.m3u8&${mockCorruptionName}=[{i:"*",key:404},{i:2}]`;
            const urlSearchParams = new URLSearchParams(queryString);
            const configs = configs_1.corruptorConfigUtils(urlSearchParams);
            const config = {
                name: mockCorruptionName,
                getManifestConfigs: () => [
                    null,
                    [
                        { i: "*", fields: { key: 404 } },
                        { i: 2, fields: null },
                    ],
                ],
                getSegmentConfigs: () => [null, { fields: null }],
            };
            configs.register(config);
            const [error, allMutations] = configs.getAllManifestConfigs(mediaM3U.get("mediaSequence"));
            // Act
            const manifestUtils = hlsManifestUtils_2.default();
            const proxyManifest = manifestUtils.createProxyMediaManifest(mediaM3U, mockBaseUrl, allMutations);
            // Assert
            const expected = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:1
#EXT-X-PLAYLIST-TYPE:VOD
#EXTINF:10.0000,
../../segments/proxy-segment?url=https%3A%2F%2Fmock.mock.com%2Fstream%2Fhls%2Fmanifest_1_00001.ts&_test_=%7Bkey%3A404%7D
#EXTINF:10.0000,
../../segments/proxy-segment?url=https%3A%2F%2Fmock.mock.com%2Fstream%2Fhls%2Fmanifest_1_00002.ts&_test_=%7Bkey%3A404%7D
#EXTINF:10.0000,
https://mock.mock.com/stream/hls/manifest_1_00003.ts
#EXT-X-ENDLIST
`;
            expect(proxyManifest).toEqual(expected);
        }));
    });
    describe("utils.segmentUrlParamString", () => {
        it("should handle fields object", () => {
            const someMap = new Map();
            someMap.set("test", { fields: { n: 150, s: "hej" }, i: 1, sq: 2 });
            const query = hlsManifestUtils_1.default().utils.segmentUrlParamString("hello", someMap);
            expect(query).toEqual("url=hello&test={n:150,s:hej}");
        });
        it("should handle key with empty fields object", () => {
            const someMap = new Map();
            someMap.set("timeout", { i: 1, sq: 2, fields: {} });
            const query = hlsManifestUtils_1.default().utils.segmentUrlParamString("hello", someMap);
            expect(query).toEqual("url=hello&timeout=");
        });
    });
    describe("utils.mergeMap", () => {
        it("should handle priority without default corrtupions", () => {
            // Assign
            const someValues = new Map();
            someValues.set(0, new Map().set("a", { fields: { ms: 100 } }).set("b", { fields: { code: 300 } }));
            const size = 3;
            // Act
            const actual = hlsManifestUtils_1.default().utils.mergeMap(size, someValues);
            const expected = [new Map().set("a", { fields: { ms: 100 } }).set("b", { fields: { code: 300 } }), null, null];
            // Assert
            expect(actual).toEqual(expected);
        });
        it("should handle priority with default corrtupions", () => {
            // Assign
            const someValues = new Map();
            someValues
                .set(0, new Map().set("a", { fields: { ms: 100 } }).set("b", { fields: { code: 300 } }))
                .set(2, new Map().set("a", {
                fields: null,
            }))
                .set("*", new Map().set("a", { fields: { ms: 50 } }));
            const size = 3;
            // Act
            const actual = hlsManifestUtils_1.default().utils.mergeMap(size, someValues);
            const expected = [
                new Map().set("a", { fields: { ms: 100 } }).set("b", { fields: { code: 300 } }),
                new Map().set("a", { fields: { ms: 50 } }),
                null,
            ];
            // Assert
            expect(actual).toEqual(expected);
        });
        it("should handle multiple defaults with one noop", () => {
            // Arrange
            const someValues = new Map();
            someValues
                .set(2, new Map().set("a", {
                fields: null,
            }))
                .set("*", new Map().set("a", { fields: { ms: 50 } }).set("b", { fields: { code: 500 } }));
            const size = 3;
            // Act
            const actual = hlsManifestUtils_1.default().utils.mergeMap(size, someValues);
            const expected = [
                new Map().set("a", { fields: { ms: 50 } }).set("b", { fields: { code: 500 } }),
                new Map().set("a", { fields: { ms: 50 } }).set("b", { fields: { code: 500 } }),
                new Map().set("b", { fields: { code: 500 } }),
            ];
            // Assert
            expect(actual).toEqual(expected);
        });
        it("should handle empty fields prop correct", () => {
            // Arrange
            const someValues = new Map().set(0, new Map().set("a", { fields: {} }));
            const size = 2;
            // Act
            const actual = hlsManifestUtils_1.default().utils.mergeMap(size, someValues);
            const expected = [new Map().set("a", { fields: {} }), null];
            // Assert
            expect(actual).toEqual(expected);
        });
    });
});
//# sourceMappingURL=hlsManifestUtils.test.js.map