import timeoutConfig from "./timeout";

describe("manifest.utils.corruptions.timeout", () => {
  describe("getManifestConfigs", () => {
    const { getManifestConfigs, getSegmentConfigs, name } = timeoutConfig;
    it("should have correct name", () => {
      // Assert
      expect(name).toEqual("timeout");
    });
    it("should handle valid input", () => {
      // Arrange
      const timeoutValueString = JSON.stringify([{ i: 0 }, { sq: 0 }]);

      // Act
      const actual = getManifestConfigs(timeoutValueString);
      const expected = [
        null,
        [
          { i: 0, fields: {} },
          { sq: 0, fields: {} },
        ],
      ];

      // Assert
      expect(actual).toEqual(expected);
    });

    it("should handle all * indexes", () => {
      // Arrange
      const timeoutValueString = JSON.stringify([{ i: 0 }, { i: "*" }]);

      // Act
      const actual = getManifestConfigs(timeoutValueString);
      const expected = [
        null,
        [
          { i: 0, fields: null },
          { i: "*", fields: {} },
        ],
      ];

      // Assert
      expect(actual).toEqual(expected);
    });

    it("should handle all * sequences", () => {
      // Arrange
      const timeoutValueString = JSON.stringify([{ sq: 0 }, { sq: "*" }]);

      // Act
      const actual = getManifestConfigs(timeoutValueString);
      const expected = [
        null,
        [
          { sq: 0, fields: null },
          { sq: "*", fields: {} },
        ],
      ];

      // Assert
      expect(actual).toEqual(expected);
    });

    it("should handle no index and no sequence correct", () => {
      // Arrange
      const timeoutValueString = JSON.stringify([{ irrelevant: 123 }]);

      // Act
      const actual = getManifestConfigs(timeoutValueString);
      const expected = [
        {
          message: "Incorrect timeout query format. Either 'i' or 'sq' is required in a single query object.",
          status: 400,
        },
        null,
      ];

      // Assert
      expect(actual).toEqual(expected);
    });

    it("should handle both index and sequence in the query object", () => {
      // Arrange
      const timeoutValueString = JSON.stringify([{ i: 0, sq: 2 }]);

      // Act
      const actual = getManifestConfigs(timeoutValueString);
      const expected = [
        {
          message: "Incorrect timeout query format. 'i' and 'sq' are mutually exclusive in a single query object.",
          status: 400,
        },
        null,
      ];

      // Assert
      expect(actual).toEqual(expected);
    });

    it("should handle illegal characters in query object", () => {
      // Arrange
      const timeoutValueString = JSON.stringify([{ ms: "hehe", i: false, sq: { he: "he" } }]);

      // Act
      const actual = getManifestConfigs(timeoutValueString);
      const expected = [
        {
          message: "Incorrect timeout query format. Expected format: [{i?:number, sq?:number},...n] where i and sq are mutually exclusive.",
          status: 400,
        },
        null,
      ];

      // Assert
      expect(actual).toEqual(expected);
    });

    it("should handle invalid format", () => {
      // Arrange
      const timeoutValueString = JSON.stringify("Fel");

      // Act
      const actual = getManifestConfigs(timeoutValueString);
      const expected = [
        {
          message: "Incorrect timeout query format. Expected format: [{i?:number, sq?:number},...n] where i and sq are mutually exclusive.",
          status: 400,
        },
        null,
      ];

      // Assert
      expect(actual).toEqual(expected);
    });
  });
});
