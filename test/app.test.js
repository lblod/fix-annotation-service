import assert from "assert";
import esmock from "esmock";

// 1. Mock the response from the SPARQL query
import templateReponse from "./mocks/select-template-response.json" assert { type: "json" };
// 2. Paresed bindings from the response
const parsedBinding = [
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
// 3. Annotated array to be generated
const annotatedArray = [
  {
    uri: "http://data.lblod.info/templates/6486F5D34E5B47D5A3A1EDDF",
    annotated:
      '\n    <span resource="http://data.lblod.info/mappings/6486F5D44E5B47D5A3A1EDE3" typeof="ext:Mapping">\n      <span property="dct:source" resource="undefined"></span>\n      <span property="dct:type" content="location"></span>\n      <span property="ext:content">${locatie}</span>\n    </span>\n   abc, \n    <span typeof="ext:Mapping" resource="http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE4">\n      <span class="mark-highlight-manual">${autonummer}</span>\n    </span>\n   dan \n    <span typeof="ext:Mapping" resource="http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE5">\n      <span class="mark-highlight-manual">${tekst}</span>\n    </span>\n   codelijst van \n    <span resource="http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE6" typeof="ext:Mapping">\n      <span property="dct:source" resource="undefined"></span>\n      <span property="dct:type" content="codelist"></span>\n      <span property="ext:codelist" resource="http://lblod.data.gift/concept-schemes/61C054CEE3249100080000B9"></span>\n      <span property="ext:content">${codelijst}</span>\n    </span>\n   en ook nog is een datum eh \n    <span resource="http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE7" typeof="ext:Mapping">\n      <span property="dct:type" content="date"></span>\n      <span property="ext:content" datatype="xsd:date">${datum}</span>\n    </span>\n   \n    <span typeof="ext:Mapping" resource="http://data.lblod.info/mappings/649D79A34E5B47D5A3A1EE0F">\n      <span class="mark-highlight-manual">${cijferstesten}</span>\n    </span>\n  ',
  },
  {
    uri: "http://data.lblod.info/templates/1907fb2e-b36c-45b1-9a69-e2c367f4fb28",
    annotated: "de bestuurders hebben voorrang",
  },
];
// 4. Update query to be generated
const UpdateQuery = `
PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    
DELETE WHERE {
  GRAPH <http://mu.semte.ch/graphs/mow/registry> { 
    <http://data.lblod.info/templates/6486F5D34E5B47D5A3A1EDDF> ext:annotated ?template .
  }
}; 
DELETE WHERE {
  GRAPH <http://mu.semte.ch/graphs/mow/registry> { 
    <http://data.lblod.info/templates/1907fb2e-b36c-45b1-9a69-e2c367f4fb28> ext:annotated ?template .
  }
};

INSERT DATA {
  GRAPH <http://mu.semte.ch/graphs/mow/registry> {
    <http://data.lblod.info/templates/6486F5D34E5B47D5A3A1EDDF> ext:annotated 
      <span resource="http://data.lblod.info/mappings/6486F5D44E5B47D5A3A1EDE3" typeof="ext:Mapping">
      <span property="dct:source" resource="undefined"></span>
      <span property="dct:type" content="location"></span>
      <span property="ext:content">\${locatie}</span>
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
      <span resource="http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE6" typeof="ext:Mapping">
      <span property="dct:source" resource="undefined"></span>
      <span property="dct:type" content="codelist"></span>
      <span property="ext:codelist" resource="http://lblod.data.gift/concept-schemes/61C054CEE3249100080000B9"></span>
      <span property="ext:content">\${codelijst}</span>
      </span>
      en ook nog is een datum eh 
      <span resource="http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE7" typeof="ext:Mapping">
      <span property="dct:type" content="date"></span>
      <span property="ext:content" datatype="xsd:date">\${datum}</span>
      </span>

      <span typeof="ext:Mapping" resource="http://data.lblod.info/mappings/649D79A34E5B47D5A3A1EE0F">
      <span class="mark-highlight-manual">\${cijferstesten}</span>
      </span>
      .
    <http://data.lblod.info/templates/1907fb2e-b36c-45b1-9a69-e2c367f4fb28> ext:annotated de bestuurders hebben voorrang .

  }
}`;

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
const {
  parseBindings,
  applyTemplateMappings,
  generateAnnotatedArray,
  splitIntoChunks,
  generateUpdateQuery,
} = await esmock.strict(
  "../app.js",
  {
    mu: muMock,
    "@lblod/mu-auth-sudo": {
      querySudo: () => {},
      updateSudo: () => {},
    },
  },
  {},
  {
    isModuleNotFoundError: false,
  }
);

// Normalize strings by removing extra whitespace and trimming
const normalize = (str) => str.replace(/\s+/g, " ").trim();

describe("parseBindings", () => {
  it("should parse bindings correctly", () => {
    const response = templateReponse;
    const expected = parsedBinding;
    const result = parseBindings(response.results.bindings);
    assert.deepStrictEqual(result, expected);
  });

  it("should return empty array if no bindings are provided", () => {
    const response = { results: { bindings: [] } };
    const result = parseBindings(response.results.bindings);
    assert.deepStrictEqual(result, []);
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
    const result = applyTemplateMappings(
      template.templateValue,
      template.mappings
    );
    assert.strictEqual(normalize(result), normalize(expected));
  });
});

describe("generateAnnotatedArray", () => {
  it("should generate annotated array", () => {
    const data = parsedBinding;
    const expected = annotatedArray;
    const result = generateAnnotatedArray(data);
    assert.deepStrictEqual(result, expected);
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

describe("generateUpdateQuery", () => {
  it("should generate update query", () => {
    const data = annotatedArray;
    const expected = UpdateQuery;
    const result = generateUpdateQuery(data);
    assert.strictEqual(normalize(result), normalize(expected));
  });
});
