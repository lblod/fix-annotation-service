import assert from "assert";
import esmock from "esmock";
import sinon from "sinon";

import templateReponse from "./mocks/select-template-response.json" assert { type: "json" };

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
const { splitIntoChunks, applyTemplateMappings, parseBindings } = await esmock.strict(
  "../app.js",
  {
    mu: muMock,
    "@lblod/mu-auth-sudo": {
      querySudo: querySudoStub,
      updateSudo: updateSudoStub,
    },
  },
  {},
  {
    isModuleNotFoundError: false,
  }
);

// Normalize HTML strings by removing extra whitespace and trimming
const normalizeHtml = (html) => html.replace(/\s+/g, " ").trim();

describe("parseBindings", () => {
  it("should parse bindings correctly", () => {
    const response = templateReponse;
    const expected = [
      {
        uri: "http://data.lblod.info/templates/6486F5D34E5B47D5A3A1EDDF",
        templateValue:
          "${locatie} abc, ${autonummer} dan ${tekst} codelijst van ${codelijst} en ook nog is een datum eh ${datum} ${cijferstesten}",
        mappings: [
          {
            uri: "http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE6",
            type: "codelist",
            variable: "codelijst",
            codelist:
              "http://lblod.data.gift/concept-schemes/61C054CEE3249100080000B9",
          },
          {
            uri: "http://data.lblod.info/mappings/649D79A34E5B47D5A3A1EE0F",
            type: "number",
            variable: "cijferstesten",
          },
          {
            uri: "http://data.lblod.info/mappings/6486F5D44E5B47D5A3A1EDE3",
            type: "location",
            variable: "locatie",
          },
          {
            uri: "http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE4",
            type: "number",
            variable: "autonummer",
          },
          {
            uri: "http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE5",
            type: "text",
            variable: "tekst",
          },
          {
            uri: "http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE7",
            type: "date",
            variable: "datum",
          },
        ],
      },
      {
        mappings: [],
        templateValue: "de bestuurders hebben voorrang",
        uri: "http://data.lblod.info/templates/1907fb2e-b36c-45b1-9a69-e2c367f4fb28",
      },
    ];
    const result = parseBindings(response.results.bindings);
    assert.deepStrictEqual(result, expected);
  });

  it("should return empty array if no bindings are provided", () => {
    const response = { results: { bindings: [] } };
    const result = parseBindings(response.results.bindings);
    assert.deepStrictEqual(result, []);
  });
});

describe("splitIntoChunks", () => {
  it("should split array into chunks of specified size", () => {
    const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const chunkSize = 3;
    const expected = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]];
    const result = splitIntoChunks(array, chunkSize);
    assert.deepStrictEqual(result[0], expected[0]);
  });
});

describe("applyTemplateMappings", () => {
  it("should include mappings in the template", () => {
    const template = {
      uri: "http://example.com",
      templateValue:
        "${locatie} abc, ${autonummer} dan ${tekst} codelijst van ${codelijst} en ook nog is een datum eh ${datum} ${cijferstesten}",
      mappings: [
        {
          uri: "http://data.lblod.info/mappings/6486F5D44E5B47D5A3A1EDE3",
          variable: "locatie",
          variableType: "location",
        },
        {
          uri: "http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE4",
          variable: "autonummer",
          variableType: "number",
        },
        {
          uri: "http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE5",
          variable: "tekst",
          variableType: "text",
        },
        {
          uri: "http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE6",
          variable: "codelijst",
          variableType: "codelist",
          codelist:
            "http://lblod.data.gift/concept-schemes/61C054CEE3249100080000B9",
        },
        {
          uri: "http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE7",
          variable: "datum",
          variableType: "date",
        },
        {
          uri: "http://data.lblod.info/mappings/649D79A34E5B47D5A3A1EE0F",
          variable: "cijferstesten",
          variableType: "number",
        },
      ],
    };
    const expected = `
      <span typeof="ext:Mapping" resource="http://data.lblod.info/mappings/6486F5D44E5B47D5A3A1EDE3">
        <span class="mark-highlight-manual">\${locatie}</span>
      </span>
      abc, 
      <span typeof="ext:Mapping" resource="http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE4">
        <span class="mark-highlight-manual">\${autonummer}</span>
      </span>
      dan 
      <span typeof="ext:Mapping" resource="http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE5">
        <span class="mark-highlight-manual">\${tekst}</span>
      </span>
      codelijst van 
      <span typeof="ext:Mapping" resource="http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE6">
        <span class="mark-highlight-manual">\${codelijst}</span>
      </span>
      en ook nog is een datum eh 
      <span typeof="ext:Mapping" resource="http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE7">
        <span class="mark-highlight-manual">\${datum}</span>
      </span>
      
      <span typeof="ext:Mapping" resource="http://data.lblod.info/mappings/649D79A34E5B47D5A3A1EE0F">
        <span class="mark-highlight-manual">\${cijferstesten}</span>
      </span>`;
    const result = applyTemplateMappings(template.templateValue, template.mappings);
    assert.strictEqual(normalizeHtml(result), normalizeHtml(expected));
  });
});
