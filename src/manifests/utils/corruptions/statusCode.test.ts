import statusCodeConfig from './statusCode';

describe('manifest.utils.corruptions.statusCode', () => {
  describe('getManifestConfigs', () => {
    const { getManifestConfigs, getSegmentConfigs, name } = statusCodeConfig;
    it('should have correct name', () => {
      // Assert
      expect(name).toEqual('statusCode');
    });
    it('should handle valid input', () => {
      // Arrange
      const statusValue = [
        { i: 0, code: 150 },
        { i: 0, code: 500 },
        { sq: 0, code: 1500 }
      ];

      // Act
      const actual = getManifestConfigs(statusValue);
      const expected = [
        null,
        [
          { i: 0, fields: { code: 150 } },
          { sq: 0, fields: { code: 1500 } }
        ]
      ];

      // Assert
      expect(actual).toEqual(expected);
    });

    it('should handle all * indexes', () => {
      // Arrange
      const statusValue: Record<string, number | '*'>[] = [
        { i: '*', code: 150 },
        { i: 0 }
      ];

      // Act
      const actual = getManifestConfigs(statusValue);
      const expected = [
        null,
        [
          { i: '*', fields: { code: 150 } },
          { i: 0, fields: null }
        ]
      ];

      // Assert
      expect(actual).toEqual(expected);
    });

    it('should handle all * sequences', () => {
      // Arrange
      const statusValue: Record<string, number | '*'>[] = [
        { sq: '*', code: 150 },
        { sq: 0 }
      ];

      // Act
      const actual = getManifestConfigs(statusValue);
      const expected = [
        null,
        [
          { sq: '*', fields: { code: 150 } },
          { sq: 0, fields: null }
        ]
      ];

      // Assert
      expect(actual).toEqual(expected);
    });

    it('should handle no index and no sequence correct', () => {
      // Arrange
      const statusValue = [{ code: 150 }];

      // Act
      const actual = getManifestConfigs(statusValue);
      const expected = [
        {
          message:
            "Incorrect statusCode query format. Either 'i' or 'sq' is required in a single query object.",
          status: 400
        },
        null
      ];

      // Assert
      expect(actual).toEqual(expected);
    });

    it('should handle both index and sequence in the query object', () => {
      // Arrange
      const statusValue = [{ code: 150, i: 0, sq: 2 }];

      // Act
      const actual = getManifestConfigs(statusValue);
      const expected = [
        {
          message:
            "Incorrect statusCode query format. 'i' and 'sq' are mutually exclusive in a single query object.",
          status: 400
        },
        null
      ];

      // Assert
      expect(actual).toEqual(expected);
    });

    it('should handle illegal characters in query object', () => {
      // Arrange
      const statusValue = [{ code: 'hehe', i: false, sq: { he: 'he' } }] as any;

      // Act
      const actual = getManifestConfigs(statusValue);
      const expected = [
        {
          message:
            'Incorrect statusCode query format. Expected format: [{i?:number, sq?:number, br?:number, code:number}, ...n] where i and sq are mutually exclusive.',
          status: 400
        },
        null
      ];

      // Assert
      expect(actual).toEqual(expected);
    });

    it('should handle invalid format', () => {
      // Arrange
      const statusValue = 'Faulty' as any;

      // Act
      const actual = getManifestConfigs(statusValue);
      const expected = [
        {
          message:
            'Incorrect statusCode query format. Expected format: [{i?:number, sq?:number, br?:number, code:number}, ...n] where i and sq are mutually exclusive.',
          status: 400
        },
        null
      ];

      // Assert
      expect(actual).toEqual(expected);
    });

    it('should handle multiple defaults *', () => {
      // Arrange
      const statusValue: Record<string, number | '*'>[] = [
        { code: 400, i: '*' },
        { code: 401, sq: '*' },
        { code: 404, i: '*' }
      ];
      // Act
      const actual = getManifestConfigs(statusValue);
      const expected = [
        null,
        [
          {
            fields: {
              code: 400
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
