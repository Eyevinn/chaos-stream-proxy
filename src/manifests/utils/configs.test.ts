import {
  corruptorConfigUtils,
  SegmentCorruptorQueryConfig,
  CorruptorConfig,
  CorruptorIndexMap,
  CorruptorLevelMap
} from './configs';
import statusCodeConfig from './corruptions/statusCode';
import throttleConfig from './corruptions/throttle';

describe('configs', () => {
  describe('utils', () => {
    describe('JSONifyUrlParamValue', () => {
      it('should handle happy param', () => {
        // Arrange
        const configs = corruptorConfigUtils(new URLSearchParams());

        // Act
        const actual = configs.utils.getJSONParsableString(
          '[{i:0,sq:1,extra:2}]'
        );
        const expected = JSON.stringify([{ i: 0, sq: 1, extra: 2 }]);

        // Assert
        expect(actual).toEqual(expected);
      });

      it('should handle empty param', () => {
        // Arrange
        const configs = corruptorConfigUtils(new URLSearchParams());

        // Act
        const actual = configs.utils.getJSONParsableString('');

        const expected = '';

        // Assert
        expect(actual).toEqual(expected);
      });

      it("should handle 'unparseable' json format", () => {
        // Arrange
        const configs = corruptorConfigUtils(new URLSearchParams());

        // Act
        const actual = configs.utils.getJSONParsableString(
          '{i:0,sq:1,extra:2}]'
        );
        const expected = '{"i":0,"sq":1,"extra":2}]';

        // Assert
        expect(actual).toEqual(expected);
      });
    });
  });

  describe('register', () => {
    it('should handle happy register correct', () => {
      // Arrange
      const configs = corruptorConfigUtils(new URLSearchParams());
      const config: SegmentCorruptorQueryConfig = {
        name: 'test',
        getManifestConfigs: () => [null, []],
        getSegmentConfigs: () => [null, { fields: null }]
      };

      // Act
      configs.register(config);

      // Assert
      expect(configs).toHaveProperty('registered', [config]);
    });

    it('should handle register without name', () => {
      // Arrange
      const configs = corruptorConfigUtils(new URLSearchParams());
      const config: SegmentCorruptorQueryConfig = {
        name: '',
        getManifestConfigs: () => [null, []],
        getSegmentConfigs: () => [null, { fields: null }]
      };

      // Act
      configs.register(config);

      // Assert
      expect(configs).toHaveProperty('registered', []);
    });
  });

  describe('getAllManifestConfigs', () => {
    const env = process.env;
    beforeEach(() => {
      jest.resetModules();
      process.env = { ...env };
    });

    afterEach(() => {
      process.env = env;
    });

    it('should handle matching config with url query params', () => {
      // Arrange
      const configs = corruptorConfigUtils(
        new URLSearchParams(
          'test1=[{i:0,ms:150}]&test2=[{i:1,ms:250}]&test3=[{l:1,ms:400}]'
        )
      );
      const config1: SegmentCorruptorQueryConfig = {
        name: 'test1',
        getManifestConfigs: () => [null, [{ i: 0, fields: { ms: 150 } }]],
        getSegmentConfigs: () => [null, { fields: null }]
      };
      const config2: SegmentCorruptorQueryConfig = {
        name: 'test2',
        getManifestConfigs: () => [null, [{ i: 1, fields: { ms: 250 } }]],
        getSegmentConfigs: () => [null, { fields: null }]
      };
      const config3: SegmentCorruptorQueryConfig = {
        name: 'test3',
        getManifestConfigs: () => [null, [{ l: 1, fields: { ms: 400 } }]],
        getSegmentConfigs: () => [null, { fields: null }]
      };

      // Act
      configs.register(config1);
      configs.register(config2);
      configs.register(config3);
      const [err, actualIndex, actualLevel] = configs.getAllManifestConfigs(0);
      const expectedIndex = new CorruptorIndexMap([
        [
          0,
          new Map([
            [
              'test1',
              {
                fields: { ms: 150 },
                i: 0
              }
            ]
          ])
        ],
        [
          1,
          new Map([
            [
              'test2',
              {
                fields: { ms: 250 },
                i: 1
              }
            ]
          ])
        ]
      ]);
      const expectedLevel = new CorruptorLevelMap([
        [
          1,
          new Map([
            [
              'test3',
              {
                fields: { ms: 400 },
                l: 1
              }
            ]
          ])
        ]
      ]);
      // Assert
      expect(err).toBeNull();
      expect(actualIndex).toEqual(expectedIndex);
      expect(actualLevel).toEqual(expectedLevel);
    });

    describe('in stateful mode', () => {
      let statefulConfig;
      beforeAll(() => {
        process.env.STATEFUL = 'true';
        statefulConfig = require('./configs');
      });

      it('should handle media sequence offsets', () => {
        // Arrange
        const configs = statefulConfig.corruptorConfigUtils(
          new URLSearchParams(
            'statusCode=[{rsq:15,code:400}]&throttle=[{sq:15,rate:1000}]'
          )
        );

        configs.register(statusCodeConfig).register(throttleConfig);

        // Act

        const [err, actual] = configs.getAllManifestConfigs(0, false, 100);

        // Assert
        expect(err).toBeNull();
        expect(actual.get(115)).toEqual(
          new Map([
            [
              'statusCode',
              {
                fields: { code: 400 },
                sq: 115
              }
            ]
          ])
        );
        expect(actual.get(15)).toEqual(
          new Map([
            [
              'throttle',
              {
                fields: { rate: 1000 },
                sq: 15
              }
            ]
          ])
        );
      });
    });
  });

  describe('getAllSegmentConfigs', () => {
    it('should handle config with empty valued url param', () => {
      // Arrange
      const configs = corruptorConfigUtils(new URLSearchParams('test='));
      const config: SegmentCorruptorQueryConfig = {
        name: 'test',
        getManifestConfigs: () => [null, []],
        getSegmentConfigs: () => [null, { fields: {} }]
      };
      configs.register(config);

      // Act
      const actual = configs.getAllSegmentConfigs();
      const expected = [
        null,
        new Map<string, CorruptorConfig>().set('test', { fields: {} })
      ];

      // Assert
      expect(actual).toEqual(expected);
    });

    it('should handle empty url params', () => {
      // Arrange
      const configs = corruptorConfigUtils(new URLSearchParams(''));
      const config: SegmentCorruptorQueryConfig = {
        name: 'test',
        getManifestConfigs: () => [null, []],
        getSegmentConfigs: () => [null, { fields: {} }]
      };
      configs.register(config);

      // Act
      const actual = configs.getAllSegmentConfigs();
      const expected = [null, new Map()];

      // Assert
      expect(actual).toEqual(expected);
    });
  });
});
