import assert from "assert";
import esmock from "esmock";
import sinon from "sinon";

const querySudoStub = sinon.stub();
const updateSudoStub = sinon.stub();

// Mock the 'mu' module
const muMock = {
  app: {
    get: () => {},
    post: () => {},
    use: () => {},
  },
  errorHandler: () => {},
  sparqlEscapeString: (str) => str,
};

// Import the module with the mocked 'mu' dependency
const { splitIntoChunks } = await esmock.strict(
  "../app.js",
  { mu: muMock,"@lblod/mu-auth-sudo": {
      querySudo: querySudoStub,
      updateSudo: updateSudoStub,
    }, },
  {},
  {
    isModuleNotFoundError: false,
  }
);

describe("splitIntoChunks", () => {
  it("should split array into chunks of specified size", () => {
    const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const chunkSize = 3;
    const expected = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]];
    const result = splitIntoChunks(array, chunkSize);
    assert.deepStrictEqual(result, expected);
  });
});
