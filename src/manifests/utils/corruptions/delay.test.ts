import delayConfig from "./delay";

describe("manifest.utils.corruptions.delay", () => {
  describe("getManifestConfigs", () => {
    const { getManifestConfigs, getSegmentConfigs, name } = delayConfig;
    it("should have correct name", () => {
      // Assert
      expect(name).toEqual("delay");
    });
    it("should handle valid input", () => {
      // Arrange
      const delayValueString = JSON.stringify([
        { i: 0, ms: 150 },
        { i: 0, ms: 500 },
        { sq: 0, ms: 1500 },
        { sq: 0, ms: 2500 },
      ]);

      // Act
      const actual = getManifestConfigs(delayValueString);
      const expected = [
        null,
        [
          { i: 0, fields: { ms: 150 } },
          { sq: 0, fields: { ms: 1500 } },
        ],
      ];

      // Assert
      expect(actual).toEqual(expected);
    });

    it("should handle all * indexes", () => {
      // Arrange
      const delayValueString = JSON.stringify([{ sq: 5, ms: 50 }, { i: 0 }, { i: 1, ms: 10 }, { i: "*", ms: 150 }, { i: 2 }, { i: 3, ms: 20 }]);

      // Act
      const actual = getManifestConfigs(delayValueString);
      const expected = [
        null,
        [
          { i: 0, fields: null },
          { i: 1, fields: { ms: 10 } },
          { i: "*", fields: { ms: 150 } },
          { i: 2, fields: null },
          { i: 3, fields: { ms: 20 } },
          { sq: 5, fields: { ms: 50 } },
        ],
      ];

      // Assert
      expect(actual).toEqual(expected);
    });

    it("should handle all * sequences", () => {
      // Arrange
      const delayValueString = JSON.stringify([{ sq: 0 }, { sq: 5, ms: 50 }, { sq: "*", ms: 150 }, { sq: 1 }]);

      // Act
      const actual = getManifestConfigs(delayValueString);
      const expected = [
        null,
        [
          { sq: 0, fields: null },
          { sq: 5, fields: { ms: 50 } },
          { sq: "*", fields: { ms: 150 } },
          { sq: 1, fields: null },
        ],
      ];

      // Assert
      expect(actual).toEqual(expected);
    });

    it("should handle no index and no sequence correct", () => {
      // Arrange
      const delayValueString = JSON.stringify([{ ms: 150 }]);

      // Act
      const actual = getManifestConfigs(delayValueString);
      const expected = [
        {
          message: "Incorrect delay query format. Either 'i' or 'sq' is required in a single query object.",
          status: 400,
        },
        null,
      ];

      // Assert
      expect(actual).toEqual(expected);
    });

    it("should handle both index and sequence in the query object", () => {
      // Arrange
      const delayValueString = JSON.stringify([{ ms: 150, i: 0, sq: 2 }]);

      // Act
      const actual = getManifestConfigs(delayValueString);
      const expected = [
        {
          message: "Incorrect delay query format. 'i' and 'sq' are mutually exclusive in a single query object.",
          status: 400,
        },
        null,
      ];

      // Assert
      expect(actual).toEqual(expected);
    });
    it("should handle illegal characters in query object", () => {
      // Arrange
      const delayValueString = JSON.stringify([{ ms: "hehe", i: false, sq: { he: "he" } }]);

      // Act
      const actual = getManifestConfigs(delayValueString);
      const expected = [
        {
          message: "Incorrect delay query format. Expected format: [{i?:number, sq?:number, ms:number},...n] where i and sq are mutually exclusive.",
          status: 400,
        },
        null,
      ];

      // Assert
      expect(actual).toEqual(expected);
    });

    it("should handle invalid format", () => {
      // Arrange
      const delayValueString = JSON.stringify("*{ssd''#Fel");

      // Act
      const actual = getManifestConfigs(delayValueString);
      const expected = [
        {
          message: "Incorrect delay query format. Expected format: [{i?:number, sq?:number, ms:number},...n] where i and sq are mutually exclusive.",
          status: 400,
        },
        null,
      ];

      // Assert
      expect(actual).toEqual(expected);
    });

    it("should handle multiple defaults *", () => {
      // Arrange
      const delayValueString = JSON.stringify([
        { i: "*", ms: 10 },
        { sq: "*", ms: 100 },
      ]);

      // Act
      const actual = getManifestConfigs(delayValueString);
      const expected = [null, [{ i: "*", fields: { ms: 10 } }]];

      // Assert
      expect(actual).toEqual(expected);
    });
  });
});
