import assert from "assert";
import { chunkArray, extractInsertUris } from "../../lib/utils.js";
import {
  deleteOne,
  multipleInsertWithDuplicateSubject,
  updateOne,
} from "../mocks/delta.js";

describe("utils", () => {
  describe("chunkArray", () => {
    it("should split array into chunks of specified size", () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const chunkSize = 3;
      const expected = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]];
      const result = chunkArray(array, chunkSize);
      assert.deepStrictEqual(result[0], expected[0]);
    });
  });

  describe("extractInsertUris", () => {
    it("should extract insert uris", () => {
      const result = extractInsertUris(updateOne);
      assert.deepStrictEqual(result, [
        "http://data.lblod.info/templates/61B33386BF5C7500090006E7",
      ]);
    });

    it("should return empty array if no inserts are provided", () => {
      const result = extractInsertUris(deleteOne);
      assert.deepStrictEqual(result, []);
    });

    it("should deduplicate uris", () => {
      const result = extractInsertUris(multipleInsertWithDuplicateSubject);
      assert.deepStrictEqual(result, [
        "http://mu.semte.ch/",
        "http://data.lblod.info/templates/61B33386BF5C7500090006E7",
      ]);
    });
  });
});
