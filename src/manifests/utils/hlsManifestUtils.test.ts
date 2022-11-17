import { TargetIndex } from "../../shared/types";
import { parseM3U8Stream, segmentUrlParamString } from "../../shared/utils";
import { CorruptorConfig, CorruptorConfigMap, corruptorConfigUtils, SegmentCorruptorQueryConfig } from "./configs";
import hlsManifestTools from "./hlsManifestUtils";
import { createReadStream } from "fs";
import path from "path";
import hlsManifestUtils from "./hlsManifestUtils";

describe("hlsManifestTools", () => {
  describe("createProxyMasterManifest", () => {
    it("should replace variant urls in Master manifest, with querystring and swap 'url' value with source media url", async () => {
      // Arrange
      const readStream = createReadStream(path.join(__dirname, "../../testvectors/hls/hls1_multitrack/manifest.m3u8"));
      const masterM3U = await parseM3U8Stream(readStream);
      const queryString = "url=https://mock.mock.com/stream/hls/manifest.m3u8&statusCode=[{i:0,code:404},{i:2,code:401}]&timeout=[{i:3}]&delay=[{i:2,ms:2000}]";
      const urlSearchParams = new URLSearchParams(queryString);

      // Act
      const manifestUtils = hlsManifestUtils();
      const proxyManifest: string = manifestUtils.createProxyMasterManifest(masterM3U, urlSearchParams);

      // Assert
      const expected: string = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-STREAM-INF:BANDWIDTH=4255267,AVERAGE-BANDWIDTH=4255267,CODECS="avc1.4d4032,mp4a.40.2",RESOLUTION=2560x1440,FRAME-RATE=25,AUDIO="audio",SUBTITLES="subs"
proxy-media.m3u8?url=https%3A%2F%2Fmock.mock.com%2Fstream%2Fhls%2Fmanifest_1.m3u8&statusCode=%5B%7Bi%3A0%2Ccode%3A404%7D%2C%7Bi%3A2%2Ccode%3A401%7D%5D&timeout=%5B%7Bi%3A3%7D%5D&delay=%5B%7Bi%3A2%2Cms%3A2000%7D%5D&bitrate=4255267
#EXT-X-STREAM-INF:BANDWIDTH=3062896,AVERAGE-BANDWIDTH=3062896,CODECS="avc1.4d4028,mp4a.40.2",RESOLUTION=1920x1080,FRAME-RATE=25,AUDIO="audio",SUBTITLES="subs"
proxy-media.m3u8?url=https%3A%2F%2Fmock.mock.com%2Fstream%2Fhls%2Fmanifest_2.m3u8&statusCode=%5B%7Bi%3A0%2Ccode%3A404%7D%2C%7Bi%3A2%2Ccode%3A401%7D%5D&timeout=%5B%7Bi%3A3%7D%5D&delay=%5B%7Bi%3A2%2Cms%3A2000%7D%5D&bitrate=3062896
#EXT-X-STREAM-INF:BANDWIDTH=2316761,AVERAGE-BANDWIDTH=2316761,CODECS="avc1.4d4028,mp4a.40.2",RESOLUTION=1920x1080,FRAME-RATE=25,AUDIO="audio",SUBTITLES="subs"
proxy-media.m3u8?url=https%3A%2F%2Fmock.mock.com%2Fstream%2Fhls%2Fmanifest_3.m3u8&statusCode=%5B%7Bi%3A0%2Ccode%3A404%7D%2C%7Bi%3A2%2Ccode%3A401%7D%5D&timeout=%5B%7Bi%3A3%7D%5D&delay=%5B%7Bi%3A2%2Cms%3A2000%7D%5D&bitrate=2316761

#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",LANGUAGE="en",NAME="English stereo",CHANNELS="2",DEFAULT=YES,AUTOSELECT=YES,URI="proxy-media.m3u8?url=https%3A%2F%2Fmock.mock.com%2Fstream%2Fhls%2Fmanifest_audio-en.m3u8&statusCode=%5B%7Bi%3A0%2Ccode%3A404%7D%2C%7Bi%3A2%2Ccode%3A401%7D%5D&timeout=%5B%7Bi%3A3%7D%5D&delay=%5B%7Bi%3A2%2Cms%3A2000%7D%5D"
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",LANGUAGE="sv",NAME="Swedish stereo",CHANNELS="2",DEFAULT=NO,AUTOSELECT=YES,URI="proxy-media.m3u8?url=https%3A%2F%2Fmock.mock.com%2Fstream%2Fhls%2Fmanifest_audio-sv.m3u8&statusCode=%5B%7Bi%3A0%2Ccode%3A404%7D%2C%7Bi%3A2%2Ccode%3A401%7D%5D&timeout=%5B%7Bi%3A3%7D%5D&delay=%5B%7Bi%3A2%2Cms%3A2000%7D%5D"
#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",LANGUAGE="en",NAME="English",FORCED=NO,DEFAULT=NO,AUTOSELECT=YES,URI="proxy-media.m3u8?url=https%3A%2F%2Fmock.mock.com%2Fstream%2Fhls%2Fmanifest_subs-en.m3u8&statusCode=%5B%7Bi%3A0%2Ccode%3A404%7D%2C%7Bi%3A2%2Ccode%3A401%7D%5D&timeout=%5B%7Bi%3A3%7D%5D&delay=%5B%7Bi%3A2%2Cms%3A2000%7D%5D"

`;
      expect(proxyManifest).toEqual(expected);
    });
  });

  describe("createProxyMediaManifest", () => {
    it("should replace segment urls in Media manifest, with querystring and swap 'url' value with source segment url", async () => {
      // Arrange
      const mockCorruptionName = "_test_";
      const readStream = createReadStream(path.join(__dirname, "../../testvectors/hls/hls1_multitrack/manifest_1.m3u8"));
      const mediaM3U = await parseM3U8Stream(readStream);
      const mockBaseUrl = "https://mock.mock.com/stream/hls";
      const queryString = `url=${mockBaseUrl}/manifest_1.m3u8&${mockCorruptionName}=[{i:0,key:404},{i:2,key:401}]`;
      const urlSearchParams = new URLSearchParams(queryString);

      const configs = corruptorConfigUtils(urlSearchParams);
      const config: SegmentCorruptorQueryConfig = {
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
      const manifestUtils = hlsManifestUtils();
      const proxyManifest: string = manifestUtils.createProxyMediaManifest(mediaM3U, mockBaseUrl, allMutations);
      // Assert
      const expected: string = `#EXTM3U
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
    });

    it("should replace segment urls in Media manifest, with querystring and swap 'url' value with source segment url, except for targeted noop indexes", async () => {
      // Arrange
      const mockCorruptionName = "_test_";
      const readStream = createReadStream(path.join(__dirname, "../../testvectors/hls/hls1_multitrack/manifest_1.m3u8"));
      const mediaM3U = await parseM3U8Stream(readStream);
      const mockBaseUrl = "https://mock.mock.com/stream/hls";
      const queryString = `url=${mockBaseUrl}/manifest_1.m3u8&${mockCorruptionName}=[{i:"*",key:404},{i:2}]`;
      const urlSearchParams = new URLSearchParams(queryString);

      const configs = corruptorConfigUtils(urlSearchParams);
      const config: SegmentCorruptorQueryConfig = {
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
      const manifestUtils = hlsManifestUtils();
      const proxyManifest: string = manifestUtils.createProxyMediaManifest(mediaM3U, mockBaseUrl, allMutations);
      // Assert
      const expected: string = `#EXTM3U
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
    });
  });

  describe("utils.segmentUrlParamString", () => {
    it("should handle fields object", () => {
      const someMap = new Map<string, CorruptorConfig>();
      someMap.set("test", { fields: { n: 150, s: "hej" }, i: 1, sq: 2 });
      const query = segmentUrlParamString("hello", someMap);
      expect(query).toEqual("url=hello&test={n:150,s:hej}");
    });

    it("should handle key with empty fields object", () => {
      const someMap = new Map<string, CorruptorConfig>();
      someMap.set("timeout", { i: 1, sq: 2, fields: {} });
      const query = segmentUrlParamString("hello", someMap);
      expect(query).toEqual("url=hello&timeout=");
    });
  });

  describe("utils.mergeMap", () => {
    it("should handle priority without default corrtupions", () => {
      // Assign
      const someValues = new Map<TargetIndex, CorruptorConfigMap>();
      someValues.set(0, new Map<string, CorruptorConfig>().set("a", { fields: { ms: 100 } }).set("b", { fields: { code: 300 } }));
      const size = 3;

      // Act
      const actual = hlsManifestTools().utils.mergeMap(size, someValues);
      const expected = [new Map<string, CorruptorConfig>().set("a", { fields: { ms: 100 } }).set("b", { fields: { code: 300 } }), null, null];

      // Assert
      expect(actual).toEqual(expected);
    });

    it("should handle priority with default corrtupions", () => {
      // Assign
      const someValues = new Map<TargetIndex, CorruptorConfigMap>();
      someValues
        .set(0, new Map<string, CorruptorConfig>().set("a", { fields: { ms: 100 } }).set("b", { fields: { code: 300 } }))
        .set(
          2,
          new Map<string, CorruptorConfig>().set("a", {
            fields: null,
          })
        )
        .set("*", new Map<string, CorruptorConfig>().set("a", { fields: { ms: 50 } }));
      const size = 3;

      // Act
      const actual = hlsManifestTools().utils.mergeMap(size, someValues);
      const expected = [
        new Map<string, CorruptorConfig>().set("a", { fields: { ms: 100 } }).set("b", { fields: { code: 300 } }),
        new Map<string, CorruptorConfig>().set("a", { fields: { ms: 50 } }),
        null,
      ];

      // Assert
      expect(actual).toEqual(expected);
    });

    it("should handle multiple defaults with one noop", () => {
      // Arrange
      const someValues = new Map<TargetIndex, CorruptorConfigMap>();
      someValues
        .set(
          2,
          new Map<string, CorruptorConfig>().set("a", {
            fields: null,
          })
        )
        .set("*", new Map<string, CorruptorConfig>().set("a", { fields: { ms: 50 } }).set("b", { fields: { code: 500 } }));
      const size = 3;

      // Act
      const actual = hlsManifestTools().utils.mergeMap(size, someValues);
      const expected = [
        new Map<string, CorruptorConfig>().set("a", { fields: { ms: 50 } }).set("b", { fields: { code: 500 } }),
        new Map<string, CorruptorConfig>().set("a", { fields: { ms: 50 } }).set("b", { fields: { code: 500 } }),
        new Map<string, CorruptorConfig>().set("b", { fields: { code: 500 } }),
      ];

      // Assert
      expect(actual).toEqual(expected);
    });

    it("should handle empty fields prop correct", () => {
      // Arrange
      const someValues = new Map<TargetIndex, CorruptorConfigMap>().set(0, new Map<string, CorruptorConfig>().set("a", { fields: {} }));
      const size = 2;

      // Act
      const actual = hlsManifestTools().utils.mergeMap(size, someValues);
      const expected = [new Map<string, CorruptorConfig>().set("a", { fields: {} }), null];

      // Assert
      expect(actual).toEqual(expected);
    });
  });
});
