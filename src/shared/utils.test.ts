import { URLSearchParams } from "url";
import { proxyPathBuilder } from "./utils";

describe("shared.utils", () => {
  describe("proxyPathBuilder", () => {
    it("should return correct format with value in all parameters", () => {
      // Arrange
      const itemUri = "itemUri";
      const urlSearchParams = new URLSearchParams("url=https://something.se");

      // Act
      const actual = proxyPathBuilder(itemUri, urlSearchParams, "proxy-media");
      const expected = "proxy-media?url=something.se%2FitemUri";

      // Assert
      expect(actual).toEqual(expected);
    });

    it("should handle empty parameters", () => {
      // Arrange
      const itemUri = "";
      const urlSearchParams = null;

      // Act
      const actual = proxyPathBuilder(itemUri, urlSearchParams, "proxy-media");
      const expected = "";

      // Assert
      expect(actual).toEqual(expected);
    });
  });
});
