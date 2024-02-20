import { URLSearchParams } from 'url';
import { proxyPathBuilder } from './utils';

describe('shared.utils', () => {
  describe('proxyPathBuilder', () => {
    it('should return correct format with value in all parameters', () => {
      // Arrange
      const itemUri = 'video-variants/variant_3.m3u8';
      const urlSearchParams = new URLSearchParams(
        'url=https://mock.stream.origin.se/hls/vods/asset41/master.m3u8&delay=[{i:3,ms:200}]'
      );

      // Act
      const actual = proxyPathBuilder(
        itemUri,
        urlSearchParams,
        'proxy-media.m3u8'
      );
      const expected = `proxy-media.m3u8?url=${encodeURIComponent(
        'https://mock.stream.origin.se/hls/vods/asset41/video-variants/variant_3.m3u8'
      )}&delay=${encodeURIComponent('[{i:3,ms:200}]')}`;

      // Assert
      expect(actual).toEqual(expected);
    });

    it('should return correct format with value in all parameters, when source url is already an absolut url', () => {
      // Arrange
      const itemUri = 'https://different.origin.se/hls/variant_3.m3u8';
      const urlSearchParams = new URLSearchParams(
        'url=https://mock.stream.origin.se/hls/master.m3u8&delay=[{i:3,ms:200}]'
      );

      // Act
      const actual = proxyPathBuilder(
        itemUri,
        urlSearchParams,
        'proxy-media.m3u8'
      );
      const expected = `proxy-media.m3u8?url=${encodeURIComponent(
        'https://different.origin.se/hls/variant_3.m3u8'
      )}&delay=${encodeURIComponent('[{i:3,ms:200}]')}`;

      // Assert
      expect(actual).toEqual(expected);
    });

    it("should return correct format with value in all parameters, when source url string has '../'", () => {
      // Arrange
      const itemUri = '../../../pathB/path3/variant_3.m3u8';
      const urlSearchParams = new URLSearchParams(
        'url=https://mock.stream.origin.se/hls/pathA/path1/path2/master.m3u8&delay=[{i:3,ms:200}]'
      );

      // Act
      const actual = proxyPathBuilder(
        itemUri,
        urlSearchParams,
        'proxy-media.m3u8'
      );
      const expected = `proxy-media.m3u8?url=${encodeURIComponent(
        'https://mock.stream.origin.se/hls/pathB/path3/variant_3.m3u8'
      )}&delay=${encodeURIComponent('[{i:3,ms:200}]')}`;

      // Assert
      expect(actual).toEqual(expected);
    });

    it('should handle empty parameters', () => {
      // Arrange
      const itemUri = '';
      const urlSearchParams = null;

      // Act
      const actual = proxyPathBuilder(
        itemUri,
        urlSearchParams,
        'proxy-media.m3u8'
      );
      const expected = '';

      // Assert
      expect(actual).toEqual(expected);
    });
  });
});
