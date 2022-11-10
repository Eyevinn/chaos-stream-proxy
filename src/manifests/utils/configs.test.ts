import { TargetIndex } from "../../shared/types";
import { corruptorConfigUtils, SegmentCorruptorQueryConfig, CorruptorConfig, CorruptorConfigMap } from "./configs";

describe("configs", () => {
  describe("utils", () => {
    describe("JSONifyUrlParamValue", () => {
      it("should handle happy param", () => {
        // Arrange
        const configs = corruptorConfigUtils(new URLSearchParams());

        // Act
        const actual = configs.utils.getJSONParsableString("[{i:0,sq:1,extra:2}]");
        const expected = JSON.stringify([{ i: 0, sq: 1, extra: 2 }]);

        // Assert
        expect(actual).toEqual(expected);
      });

      it("should handle empty param", () => {
        // Arrange
        const configs = corruptorConfigUtils(new URLSearchParams());

        // Act
        const actual = configs.utils.getJSONParsableString("");

        const expected = "";

        // Assert
        expect(actual).toEqual(expected);
      });

      it("should handle 'unparseable' json format", () => {
        // Arrange
        const configs = corruptorConfigUtils(new URLSearchParams());

        // Act
        const actual = configs.utils.getJSONParsableString("{i:0,sq:1,extra:2}]");
        const expected = '{"i":0,"sq":1,"extra":2}]';

        // Assert
        expect(actual).toEqual(expected);
      });
    });
  });

  describe("register", () => {
    it("should handle happy register correct", () => {
      // Arrange
      const configs = corruptorConfigUtils(new URLSearchParams());
      const config: SegmentCorruptorQueryConfig = {
        name: "test",
        getManifestConfigs: () => [null, []],
        getSegmentConfigs: () => [null, { fields: null }],
      };

      // Act
      configs.register(config);

      // Assert
      expect(configs).toHaveProperty("registered", [config]);
    });

    it("should handle register without name", () => {
      // Arrange
      const configs = corruptorConfigUtils(new URLSearchParams());
      const config: SegmentCorruptorQueryConfig = {
        name: "",
        getManifestConfigs: () => [null, []],
        getSegmentConfigs: () => [null, { fields: null }],
      };

      // Act
      configs.register(config);

      // Assert
      expect(configs).toHaveProperty("registered", []);
    });
  });

  describe("getAllManifestConfigs", () => {
    it("should handle matching config with url query params", () => {
      // Arrange
      const configs = corruptorConfigUtils(new URLSearchParams("test1=[{i:0,ms:150}]&test2=[{i:1,ms:250}]"));
      const config1: SegmentCorruptorQueryConfig = {
        name: "test1",
        getManifestConfigs: () => [null, [{ i: 0, fields: { ms: 150 } }]],
        getSegmentConfigs: () => [null, { fields: null }],
      };

      // Act
      configs.register(config1);
      const actual = configs.getAllManifestConfigs(0);
      const expected = [
        null,
        new Map<TargetIndex, CorruptorConfigMap>().set(
          0,
          new Map<string, CorruptorConfig>().set("test1", {
            fields: { ms: 150 },
            i: 0,
          })
        ),
      ];
      // Assert
      expect(actual).toEqual(expected);
    });
  });

  describe("getAllSegmentConfigs", () => {
    it("should handle config with empty valued url param", () => {
      // Arrange
      const configs = corruptorConfigUtils(new URLSearchParams("test="));
      const config: SegmentCorruptorQueryConfig = {
        name: "test",
        getManifestConfigs: () => [null, []],
        getSegmentConfigs: () => [null, { fields: {} }],
      };
      configs.register(config);

      // Act
      const actual = configs.getAllSegmentConfigs();
      const expected = [null, new Map<string, CorruptorConfig>().set("test", { fields: {} })];

      // Assert
      expect(actual).toEqual(expected);
    });

    it("should handle empty url params", () => {
      // Arrange
      const configs = corruptorConfigUtils(new URLSearchParams(""));
      const config: SegmentCorruptorQueryConfig = {
        name: "test",
        getManifestConfigs: () => [null, []],
        getSegmentConfigs: () => [null, { fields: {} }],
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
