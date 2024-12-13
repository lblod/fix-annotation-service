import assert from "assert";
import esmock from "esmock";

// Mock the 'mu' module
const muMock = {
  app: {
    get: () => {},
    post: () => {},
    use: () => {},
  },
  errorHandler: () => {},
  sparqlEscapeString: (str) => `"""${str}"""`,
  sparqlEscapeUri: (uri) => `<${uri}>`,
};

// Import the module with the mocked 'mu' dependency
const {
  parseSelectTemplateBindings,
  applyTemplateMappings,
  generateAnnotatedArray,
  splitIntoChunks,
  generateUpdateQuery,
  extractInsertUris,
} = await esmock.strict(
  "../app.js",
  {
    mu: muMock,
    "@lblod/mu-auth-sudo": {
      querySudo: () => {},
      updateSudo: () => {},
    },
    "../config.js": {
      SPARQL_ENDPOINT: "http://example.com/sparql",
    },
  },
  {},
  {
    isModuleNotFoundError: false,
  }
);

import { deleteOne, multipleInsertWithDuplicateSubject, updateOne } from "./mocks/delta.js";

// 1. Mock the response from the SPARQL query
import templateReponse from "./mocks/select-template-response.json" with { type: "json" };
// 2. Paresed bindings from the response
const parsedBinding = [
  {
    uri: "http://data.lblod.info/templates/67476E5D5A9960633226D2AB",
    templateValue:
      "${locatie} abc, ${autonummer} dan ${tekst} codelijst van ${codelijst} en ook nog is een datum eh ${datum} ${cijferstesten}",
    variables: [
      {
        uri: "http://data.lblod.info/variables/67476E5D5A9960633226D2AF",
        type: "codelist",
        value: "codelijst",
        codelist:
          "http://lblod.data.gift/concept-schemes/63B58F51867176EC5DDD14C9",
      },
      {
        uri: "http://data.lblod.info/variables/67476E5E5A9960633226D2B0",
        type: "date",
        value: "datum",
      },
      {
        uri: "http://data.lblod.info/variables/67476E5D5A9960633226D2AC",
        type: "location",
        value: "locatie",
      },
      {
        uri: "http://data.lblod.info/variables/67476E5D5A9960633226D2AD",
        type: "number",
        value: "autonummer",
      },
      {
        uri: "http://data.lblod.info/variables/67476E5D5A9960633226D2AE",
        type: "text",
        value: "tekst",
      },
      {
        uri: "http://data.lblod.info/variables/67476E5E5A9960633226D2B1",
        type: "number",
        value: "cijferstesten",
      },
    ],
  },
  {
    templateValue: "de fietszone wordt afgebakend",
    uri: "http://data.lblod.info/templates/643003B35BDCDA240120BDCB",
    variables: [],
  },
];
// 3. Annotated array to be generated
const annotatedArray = [
  {
    uri: "http://data.lblod.info/templates/67476E5D5A9960633226D2AB",
    annotated:
      '\n    <span resource="http://data.lblod.info/variables/67476E5D5A9960633226D2AC" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">\n      <span property="dct:type" content="location"></span>\n      <span property="dct:source" resource="http://example.com/sparql"></span>\n      <span class="mark-highlight-manual" property="rdf:value">${locatie}</span>\n      \n    </span>\n   abc, \n    <span resource="http://data.lblod.info/variables/67476E5D5A9960633226D2AD" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">\n      <span class="mark-highlight-manual" property="rdf:value">${autonummer}</span>\n      \n    </span>\n   dan \n    <span resource="http://data.lblod.info/variables/67476E5D5A9960633226D2AE" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">\n      <span class="mark-highlight-manual" property="rdf:value">${tekst}</span>\n      \n    </span>\n   codelijst van \n    <span resource="http://data.lblod.info/variables/67476E5D5A9960633226D2AF" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">\n      <span property="dct:type" content="codelist"></span>\n      <span property="dct:source" resource="http://example.com/sparql"></span>\n      <span property="ext:codelist" resource="http://lblod.data.gift/concept-schemes/63B58F51867176EC5DDD14C9"></span>\n      <span class="mark-highlight-manual" property="rdf:value">${codelijst}</span>\n      \n    </span>\n   en ook nog is een datum eh \n    <span resource="http://data.lblod.info/variables/67476E5E5A9960633226D2B0" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">\n      <span property="dct:type" content="date"></span>\n      <span class="mark-highlight-manual" property="rdf:value" datatype="xsd:date">${datum}</span>\n      \n    </span>\n   \n    <span resource="http://data.lblod.info/variables/67476E5E5A9960633226D2B1" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">\n      <span class="mark-highlight-manual" property="rdf:value">${cijferstesten}</span>\n      \n    </span>\n  ',
  },
  {
    uri: "http://data.lblod.info/templates/643003B35BDCDA240120BDCB",
    annotated: "de fietszone wordt afgebakend",
  },
];
// 4. Update query to be generated
const UpdateQuery = `
PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    
DELETE WHERE {
  GRAPH <http://mu.semte.ch/graphs/mow/registry> { 
    <http://data.lblod.info/templates/67476E5D5A9960633226D2AB> ext:annotated ?template .
  }
}; 
DELETE WHERE {
  GRAPH <http://mu.semte.ch/graphs/mow/registry> { 
    <http://data.lblod.info/templates/643003B35BDCDA240120BDCB> ext:annotated ?template .
  }
};

INSERT DATA {
  GRAPH <http://mu.semte.ch/graphs/mow/registry> {
    <http://data.lblod.info/templates/67476E5D5A9960633226D2AB> ext:annotated """ 
      <span resource="http://data.lblod.info/variables/67476E5D5A9960633226D2AC" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
        <span property="dct:type" content="location"></span>
        <span property="dct:source" resource="http://example.com/sparql"></span>
        <span class="mark-highlight-manual" property="rdf:value">\${locatie}</span>
      </span>
      abc,
      <span resource="http://data.lblod.info/variables/67476E5D5A9960633226D2AD" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
        <span class="mark-highlight-manual" property="rdf:value">\${autonummer}</span>
      </span>
      dan
      <span resource="http://data.lblod.info/variables/67476E5D5A9960633226D2AE" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
        <span class="mark-highlight-manual" property="rdf:value">\${tekst}</span>
      </span>
      codelijst van
      <span resource="http://data.lblod.info/variables/67476E5D5A9960633226D2AF" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
        <span property="dct:type" content="codelist"></span>
        <span property="dct:source" resource="http://example.com/sparql"></span>
        <span property="ext:codelist" resource="http://lblod.data.gift/concept-schemes/63B58F51867176EC5DDD14C9"></span>
        <span class="mark-highlight-manual" property="rdf:value">\${codelijst}</span>
      </span>
      en ook nog is een datum eh
      <span resource="http://data.lblod.info/variables/67476E5E5A9960633226D2B0" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
        <span property="dct:type" content="date"></span>
        <span class="mark-highlight-manual" property="rdf:value" datatype="xsd:date">\${datum}</span>
      </span>
      <span resource="http://data.lblod.info/variables/67476E5E5A9960633226D2B1" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
        <span class="mark-highlight-manual" property="rdf:value">\${cijferstesten}</span>
      </span> """
      .
    <http://data.lblod.info/templates/643003B35BDCDA240120BDCB> ext:annotated """de fietszone wordt afgebakend""" .
  }
}`;

// Normalize strings by removing extra whitespace and trimming
const normalize = (str) => str.replace(/\s+/g, " ").trim();

describe("parseBindings", () => {
  it("should parse bindings correctly", () => {
    const response = templateReponse;
    const expected = parsedBinding;
    const result = parseSelectTemplateBindings(response.results.bindings);
    assert.deepStrictEqual(result, expected);
  });

  it("should return empty array if no bindings are provided", () => {
    const response = { results: { bindings: [] } };
    const result = parseSelectTemplateBindings(response.results.bindings);
    assert.deepStrictEqual(result, []);
  });
});

describe("applyTemplateMappings", () => {
  it("should include mappings in the template", () => {
    const template = {
      uri: "http://example.com",
      templateValue:
        "${locatie} abc, ${autonummer} dan ${tekst} codelijst van ${codelijst} en ook nog is een datum eh ${datum} ${cijferstesten}",
      variables: [
        {
          uri: "http://data.lblod.info/mappings/6486F5D44E5B47D5A3A1EDE3",
          value: "locatie",
          type: "location",
          defaultValue: "Locatie_1",
        },
        {
          uri: "http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE4",
          value: "autonummer",
          type: "number",
          defaultValue: "123",
        },
        {
          uri: "http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE5",
          value: "tekst",
          type: "text",
          defaultValue: "Tekst_1",
        },
        {
          uri: "http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE6",
          value: "codelijst",
          type: "codelist",
          codelist:
            "http://lblod.data.gift/concept-schemes/61C054CEE3249100080000B9",
          defaultValue: "Codelijst_1",
        },
        {
          uri: "http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE7",
          value: "datum",
          type: "date",
          defaultValue: "2021-01-01",
        },
        {
          uri: "http://data.lblod.info/mappings/649D79A34E5B47D5A3A1EE0F",
          value: "cijferstesten",
          type: "number",
          defaultValue: "456",
        },
      ],
    };
    const expected = `
      <span resource="http://data.lblod.info/mappings/6486F5D44E5B47D5A3A1EDE3" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
        <span property="dct:type" content="location"></span>  
        <span property="dct:source" resource="http://example.com/sparql"></span>
        <span class="mark-highlight-manual" property="rdf:value">\${locatie}</span>
        <span property="https://data.vlaanderen.be/ns/mobiliteit#standaardwaarde">Locatie_1</span>
      </span>
      abc, 
      <span resource="http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE4" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
        <span class="mark-highlight-manual" property="rdf:value">\${autonummer}</span>
        <span property="https://data.vlaanderen.be/ns/mobiliteit#standaardwaarde">123</span>
      </span>
      dan 
      <span resource="http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE5" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
        <span class="mark-highlight-manual" property="rdf:value">\${tekst}</span>
        <span property="https://data.vlaanderen.be/ns/mobiliteit#standaardwaarde">Tekst_1</span>
      </span>
      codelijst van 
      <span resource="http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE6" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
        <span property="dct:type" content="codelist"></span>   
        <span property="dct:source" resource="http://example.com/sparql"></span>
        <span property="ext:codelist" resource="http://lblod.data.gift/concept-schemes/61C054CEE3249100080000B9"></span>
        <span class="mark-highlight-manual" property="rdf:value">\${codelijst}</span>
        <span property="https://data.vlaanderen.be/ns/mobiliteit#standaardwaarde">Codelijst_1</span>
      </span>
      en ook nog is een datum eh 
      <span resource="http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE7" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
        <span property="dct:type" content="date"></span>  
        <span class="mark-highlight-manual" property="rdf:value" datatype="xsd:date">\${datum}</span>
        <span property="https://data.vlaanderen.be/ns/mobiliteit#standaardwaarde" datatype="xsd:date">2021-01-01</span>
      </span>
      
      <span resource="http://data.lblod.info/mappings/649D79A34E5B47D5A3A1EE0F" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
        <span class="mark-highlight-manual" property="rdf:value">\${cijferstesten}</span>
        <span property="https://data.vlaanderen.be/ns/mobiliteit#standaardwaarde">456</span>
      </span>`;
    const result = applyTemplateMappings(
      template.templateValue,
      template.variables
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

describe("extractInsertUris", () => {
  it("should extract insert uris", () => {
    const result = extractInsertUris(updateOne);
    assert.deepStrictEqual(result, ["http://data.lblod.info/templates/61B33386BF5C7500090006E7"]);
  });

  it("should return empty array if no inserts are provided", () => {
     const result = extractInsertUris(deleteOne);
    assert.deepStrictEqual(result, []);
  });

  it("should deduplicate uris", () => {
    const result = extractInsertUris(multipleInsertWithDuplicateSubject);
    assert.deepStrictEqual(result, ["http://mu.semte.ch/", "http://data.lblod.info/templates/61B33386BF5C7500090006E7"]);
  });
})