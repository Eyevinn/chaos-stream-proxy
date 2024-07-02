import fs from 'fs';
import * as xml2js from 'xml2js';
import path from 'path';
import dashManifestUtils from './dashManifestUtils';
import { TargetIndex } from '../../shared/types';
import { CorruptorConfigMap, CorruptorConfig } from './configs';

describe('dashManifestTools', () => {
  describe('createProxyDASHManifest', () => {
    it('should replace initialization urls & media urls in dash manifest, with absolute source url & proxy url with query parameters respectively', async () => {
      // Arrange
      const mockManifestPath =
        '../../testvectors/dash/dash1_multitrack/manifest.xml';
      const mockDashManifest = fs.readFileSync(
        path.join(__dirname, mockManifestPath),
        'utf8'
      );
      const queryString =
        'url=https://mock.mock.com/stream/dash/asset44/manifest.mpd&statusCode=[{i:0,code:404},{i:2,code:401}]&timeout=[{i:3}]&delay=[{i:2,ms:2000}]';
      const urlSearchParams = new URLSearchParams(queryString);
      // Act
      const manifestUtils = dashManifestUtils();
      const proxyManifest: string = manifestUtils.createProxyDASHManifest(
        mockDashManifest,
        urlSearchParams
      );
      // Assert
      const parser = new xml2js.Parser();
      const builder = new xml2js.Builder();
      const proxyManifestPath =
        '../../testvectors/dash/dash1_multitrack/proxy-manifest.xml';
      const dashFile: string = fs.readFileSync(
        path.join(__dirname, proxyManifestPath),
        'utf8'
      );
      let DASH_JSON;
      parser.parseString(dashFile, function (err, result) {
        DASH_JSON = result;
      });
      const expected: string = builder.buildObject(DASH_JSON);
      expect(proxyManifest).toEqual(expected);
    });

    it('should replace initialization urls & media urls in compressed dash manifest with base urls, with absolute source url & proxy url with query parameters respectively', async () => {
      // Arrange
      const mockManifestPath =
        '../../testvectors/dash/dash1_compressed/manifest.xml';
      const mockDashManifest = fs.readFileSync(
        path.join(__dirname, mockManifestPath),
        'utf8'
      );
      const queryString =
        'url=https://mock.mock.com/stream/manifest.mpd&statusCode=[{i:0,code:404},{i:2,code:401}]&timeout=[{i:3}]&delay=[{i:2,ms:2000}]';
      const urlSearchParams = new URLSearchParams(queryString);
      // Act
      const manifestUtils = dashManifestUtils();
      const proxyManifest: string = manifestUtils.createProxyDASHManifest(
        mockDashManifest,
        urlSearchParams
      );
      // Assert
      const parser = new xml2js.Parser();
      const builder = new xml2js.Builder();
      const proxyManifestPath =
        '../../testvectors/dash/dash1_compressed/proxy-manifest.xml';
      const dashFile: string = fs.readFileSync(
        path.join(__dirname, proxyManifestPath),
        'utf8'
      );
      let DASH_JSON;
      parser.parseString(dashFile, function (err, result) {
        DASH_JSON = result;
      });
      const expected: string = builder.buildObject(DASH_JSON);
      expect(proxyManifest).toEqual(expected);
    });

    it('should replace relative sequence numbers in corruptions with absolute ones', async () => {
      // Arrange
      const mockManifestPath =
        '../../testvectors/dash/dash1_relative_sequence/manifest.xml';
      const mockDashManifest = fs.readFileSync(
        path.join(__dirname, mockManifestPath),
        'utf8'
      );
      const queryString =
        'url=https://mock.mock.com/stream/dash/asset44/manifest.mpd&statusCode=[{rsq:10,code:404},{rsq:20,code:401}]&timeout=[{rsq:30}]&delay=[{rsq:40,ms:2000}]';
      const urlSearchParams = new URLSearchParams(queryString);
      // Act
      const manifestUtils = dashManifestUtils();
      const proxyManifest: string = manifestUtils.createProxyDASHManifest(
        mockDashManifest,
        urlSearchParams
      );
      // Assert
      const parser = new xml2js.Parser();
      const builder = new xml2js.Builder();
      const proxyManifestPath =
        '../../testvectors/dash/dash1_relative_sequence/proxy-manifest.xml';
      const dashFile: string = fs.readFileSync(
        path.join(__dirname, proxyManifestPath),
        'utf8'
      );
      let DASH_JSON;
      parser.parseString(dashFile, function (err, result) {
        DASH_JSON = result;
      });
      const expected: string = builder.buildObject(DASH_JSON);
      expect(proxyManifest).toEqual(expected);
    });

    it('should use the period baseUrl if it exists', async () => {
      // Arrange
      const mockManifestPath =
        '../../testvectors/dash/dash_period_baseurl/manifest.xml';
      const mockDashManifest = fs.readFileSync(
        path.join(__dirname, mockManifestPath),
        'utf8'
      );
      const manifestUtils = dashManifestUtils();
      const proxyManifest: string = manifestUtils.createProxyDASHManifest(
        mockDashManifest,
        new URLSearchParams(
          'url=https://mock.mock.com/stream/dash/period_base_url/manifest.mpd'
        )
      );
      const proxyManifestPath =
        '../../testvectors/dash/dash_period_baseurl/proxy-manifest.xml';
      const dashFile: string = fs.readFileSync(
        path.join(__dirname, proxyManifestPath),
        'utf8'
      );
      let DASH_JSON;
      const parser = new xml2js.Parser();
      const builder = new xml2js.Builder();
      parser.parseString(dashFile, function (err, result) {
        DASH_JSON = result;
      });
      const expected: string = builder.buildObject(DASH_JSON);
      expect(proxyManifest).toEqual(expected);
    });
  });
});

describe('utils.mergeMap', () => {
  it('should handle priority without default corrtupions', () => {
    // Assign
    const mockReqSegIndex = 3;
    const mockAllCorruptions = new Map<TargetIndex, CorruptorConfigMap>();
    mockAllCorruptions.set(
      mockReqSegIndex,
      new Map<string, CorruptorConfig>()
        .set('a', { fields: { ms: 100 } })
        .set('b', { fields: { code: 300 } })
    );

    // Act
    const actual = dashManifestUtils().utils.mergeMap(
      mockReqSegIndex,
      mockAllCorruptions,
      undefined
    );
    const expected = new Map<string, CorruptorConfig>()
      .set('a', { fields: { ms: 100 } })
      .set('b', { fields: { code: 300 } });

    // Assert
    expect(actual).toEqual(expected);
  });

  it('should handle priority with default corrtupions', () => {
    // Assign
    const mockAllCorruptions = new Map<TargetIndex, CorruptorConfigMap>();
    mockAllCorruptions
      .set(
        0,
        new Map<string, CorruptorConfig>()
          .set('a', { fields: { ms: 100 } })
          .set('b', { fields: { code: 300 } })
      )
      .set(
        2,
        new Map<string, CorruptorConfig>().set('a', {
          fields: null
        })
      )
      .set(
        '*',
        new Map<string, CorruptorConfig>().set('a', { fields: { ms: 50 } })
      );
    // Act
    const actual: CorruptorConfigMap[] = [];
    for (let segIdx = 0; segIdx < 3; segIdx++) {
      actual.push(
        dashManifestUtils().utils.mergeMap(
          segIdx,
          mockAllCorruptions,
          undefined
        )
      );
    }

    const expected = [
      new Map<string, CorruptorConfig>()
        .set('a', { fields: { ms: 100 } })
        .set('b', { fields: { code: 300 } }),
      new Map<string, CorruptorConfig>().set('a', { fields: { ms: 50 } }),
      new Map<string, CorruptorConfig>()
    ];
    // Assert
    expect(actual).toEqual(expected);
  });

  it('should handle multiple defaults with one noop', () => {
    // Arrange
    const mockAllCorruptions = new Map<TargetIndex, CorruptorConfigMap>();
    mockAllCorruptions
      .set(
        2,
        new Map<string, CorruptorConfig>().set('a', {
          fields: null
        })
      )
      .set(
        '*',
        new Map<string, CorruptorConfig>()
          .set('a', { fields: { ms: 50 } })
          .set('b', { fields: { code: 500 } })
      );
    // Act
    const actual: CorruptorConfigMap[] = [];
    for (let segIdx = 0; segIdx < 3; segIdx++) {
      actual.push(
        dashManifestUtils().utils.mergeMap(
          segIdx,
          mockAllCorruptions,
          undefined
        )
      );
    }
    const expected = [
      new Map<string, CorruptorConfig>()
        .set('a', { fields: { ms: 50 } })
        .set('b', { fields: { code: 500 } }),
      new Map<string, CorruptorConfig>()
        .set('a', { fields: { ms: 50 } })
        .set('b', { fields: { code: 500 } }),
      new Map<string, CorruptorConfig>().set('b', { fields: { code: 500 } })
    ];
    // Assert
    expect(actual).toEqual(expected);
  });

  it('should handle empty fields prop correct', () => {
    // Arrange
    const mockReqSegIndex = 3;
    const mockAllCorruptions = new Map<TargetIndex, CorruptorConfigMap>().set(
      mockReqSegIndex,
      new Map<string, CorruptorConfig>().set('a', { fields: {} })
    );
    // Act
    const actual = dashManifestUtils().utils.mergeMap(
      mockReqSegIndex,
      mockAllCorruptions,
      undefined
    );
    const expected = new Map<string, CorruptorConfig>().set('a', {
      fields: {}
    });
    // Assert
    expect(actual).toEqual(expected);
  });
});
