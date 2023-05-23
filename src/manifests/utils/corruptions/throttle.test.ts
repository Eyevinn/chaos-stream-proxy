import statusCodeConfig from './statusCode';
import throttleConfig from './throttle';

describe('manifest.utils.corruptions.throttle', () => {
  describe('getManifestConfigs', () => {
    const { getManifestConfigs, name } = throttleConfig;
    it('should have correct name', () => {
      // Assert
      expect(name).toEqual('throttle');
    });
    it('should handle valid input', () => {
      // Arrange
      const throttleValue = [
        { i: 0, rate: 1000 },
        { i: 0, rate: 5000 },
        { sq: 0, rate: 15000 }
      ];

      // Act
      const actual = getManifestConfigs(throttleValue);
      const expected = [
        null,
        [
          { i: 0, fields: { rate: 1000 } },
          { sq: 0, fields: { rate: 15000 } }
        ]
      ];

      // Assert
      expect(actual).toEqual(expected);
    });

    it('should handle all * indexes', () => {
      // Arrange
      const throttleValue: Record<string, number | '*'>[] = [
        { i: '*', rate: 1500 },
        { i: 0 }
      ];

      // Act
      const actual = getManifestConfigs(throttleValue);
      const expected = [
        null,
        [
          { i: '*', fields: { rate: 1500 } },
          { i: 0, fields: null }
        ]
      ];

      // Assert
      expect(actual).toEqual(expected);
    });

    it('should handle all * sequences', () => {
      // Arrange
      const throttleValue: Record<string, number | '*'>[] = [
        { sq: '*', rate: 1500 },
        { sq: 0 }
      ];

      // Act
      const actual = getManifestConfigs(throttleValue);
      const expected = [
        null,
        [
          { sq: '*', fields: { rate: 1500 } },
          { sq: 0, fields: null }
        ]
      ];

      // Assert
      expect(actual).toEqual(expected);
    });

    it('should handle no index and no sequence correct', () => {
      // Arrange
      const throttleValue = [{ rate: 1500 }];

      // Act
      const actual = getManifestConfigs(throttleValue);
      const expected = [
        {
          message:
            "Incorrect throttle query format. Either 'i' or 'sq' is required in a single query object.",
          status: 400
        },
        null
      ];

      // Assert
      expect(actual).toEqual(expected);
    });

    it('should handle both index and sequence in the query object', () => {
      // Arrange
      const throttleValue = [{ rate: 1500, i: 0, sq: 2 }];

      // Act
      const actual = getManifestConfigs(throttleValue);
      const expected = [
        {
          message:
            "Incorrect throttle query format. 'i' and 'sq' are mutually exclusive in a single query object.",
          status: 400
        },
        null
      ];

      // Assert
      expect(actual).toEqual(expected);
    });

    it('should handle illegal characters in query object', () => {
      // Arrange
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const throttleValue = [{ rate: 'hehe', i: false, sq: { he: 'he' } }] as any;

      // Act
      const actual = getManifestConfigs(throttleValue);
      const expected = [
        {
          message:
            'Incorrect throttle query format. Expected format: [{i?:number, sq?:number, br?:number, rate:number}, ...n] where i and sq are mutually exclusive.',
          status: 400
        },
        null
      ];

      // Assert
      expect(actual).toEqual(expected);
    });

    it('should handle invalid format', () => {
      // Arrange
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const throttleValue = 'Faulty' as any;

      // Act
      const actual = getManifestConfigs(throttleValue);
      const expected = [
        {
          message:
            'Incorrect throttle query format. Expected format: [{i?:number, sq?:number, br?:number, rate:number}, ...n] where i and sq are mutually exclusive.',
          status: 400
        },
        null
      ];

      // Assert
      expect(actual).toEqual(expected);
    });

    it('should handle multiple defaults *', () => {
      // Arrange
      const throttleValue: Record<string, number | '*'>[] = [
        { rate: 1000, i: '*' },
        { rate: 5000, sq: '*' },
        { rate: 10000, i: '*' }
      ];
      // Act
      const actual = getManifestConfigs(throttleValue);
      const expected = [
        null,
        [
          {
            fields: {
              rate: 1000
            },
            i: '*'
          }
        ]
      ];
      // Assert
      expect(actual).toEqual(expected);
    });
  });
});
