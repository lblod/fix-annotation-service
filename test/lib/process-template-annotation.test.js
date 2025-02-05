import assert from "assert";
import esmock from "esmock";

const {
  applyTemplateMappings,
  generateAnnotatedTemplates,
  parseSelectTemplateBindings,
} = await esmock.strict("../../lib/process-template-annotation.js", {
  "../../config.js": {
    SPARQL_ENDPOINT: "http://example.com/sparql",
  },
});

// 1. Mock the response from the SPARQL query
import templateResponse from "../mocks/select-template-response.js";

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
        label: "codelijst",
        codelist:
          "http://lblod.data.gift/concept-schemes/63B58F51867176EC5DDD14C9",
      },
      {
        uri: "http://data.lblod.info/variables/67476E5E5A9960633226D2B0",
        type: "date",
        label: "datum",
      },
      {
        uri: "http://data.lblod.info/variables/67476E5D5A9960633226D2AC",
        type: "location",
        label: "locatie",
      },
      {
        uri: "http://data.lblod.info/variables/67476E5D5A9960633226D2AD",
        type: "number",
        label: "autonummer",
      },
      {
        uri: "http://data.lblod.info/variables/67476E5D5A9960633226D2AE",
        type: "text",
        label: "tekst",
      },
      {
        uri: "http://data.lblod.info/variables/67476E5E5A9960633226D2B1",
        type: "number",
        label: "cijferstesten",
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
      `
      <span resource="http://data.lblod.info/variables/67476E5D5A9960633226D2AC" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
        <span property="dct:type" content="location"></span>
        <span property="dct:source" resource="http://example.com/sparql"></span>
        <span class="mark-highlight-manual" property="dct:title">\${locatie}</span>
      </span>
      abc,
      <span resource="http://data.lblod.info/variables/67476E5D5A9960633226D2AD" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
        <span class="mark-highlight-manual" property="dct:title">\${autonummer}</span>
      </span>
      dan
      <span resource="http://data.lblod.info/variables/67476E5D5A9960633226D2AE" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
        <span class="mark-highlight-manual" property="dct:title">\${tekst}</span>
      </span>
      codelijst van
      <span resource="http://data.lblod.info/variables/67476E5D5A9960633226D2AF" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
        <span property="dct:type" content="codelist"></span>
        <span property="dct:source" resource="http://example.com/sparql"></span>
        <span property="ext:codelist" resource="http://lblod.data.gift/concept-schemes/63B58F51867176EC5DDD14C9"></span>
        <span class="mark-highlight-manual" property="dct:title">\${codelijst}</span>
      </span>
      en ook nog is een datum eh
      <span resource="http://data.lblod.info/variables/67476E5E5A9960633226D2B0" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
        <span property="dct:type" content="date"></span>
        <span class="mark-highlight-manual" property="dct:title">\${datum}</span>
      </span>
      <span resource="http://data.lblod.info/variables/67476E5E5A9960633226D2B1" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
        <span class="mark-highlight-manual" property="dct:title">\${cijferstesten}</span>
      </span>
      `,
  },
  {
    uri: "http://data.lblod.info/templates/643003B35BDCDA240120BDCB",
    annotated: "de fietszone wordt afgebakend",
  },
];

// Normalize strings by removing extra whitespace and trimming
const normalize = (str) => str.replace(/\s+/g, " ").trim();

describe("process template annotation", () => {
  describe("parseSelectTemplateBindings", () => {
    it("should parse bindings correctly", () => {
      const response = templateResponse;
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
            label: "locatie",
            type: "location",
            defaultValue: "Locatie_1",
          },
          {
            uri: "http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE4",
            label: "autonummer",
            type: "number",
            defaultValue: "123",
          },
          {
            uri: "http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE5",
            label: "tekst",
            type: "text",
            defaultValue: "Tekst_1",
          },
          {
            uri: "http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE6",
            label: "codelijst",
            type: "codelist",
            codelist:
              "http://lblod.data.gift/concept-schemes/61C054CEE3249100080000B9",
            defaultValue: "Codelijst_1",
          },
          {
            uri: "http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE7",
            label: "datum",
            type: "date",
            defaultValue: "2021-01-01",
          },
          {
            uri: "http://data.lblod.info/mappings/649D79A34E5B47D5A3A1EE0F",
            label: "cijferstesten",
            type: "number",
            defaultValue: "456",
          },
        ],
      };
      const expected = `
        <span resource="http://data.lblod.info/mappings/6486F5D44E5B47D5A3A1EDE3" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
          <span property="dct:type" content="location"></span>  
          <span property="dct:source" resource="http://example.com/sparql"></span>
          <span class="mark-highlight-manual" property="dct:title">\${locatie}</span>
          <span property="https://data.vlaanderen.be/ns/mobiliteit#standaardwaarde">Locatie_1</span>
        </span>
        abc, 
        <span resource="http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE4" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
          <span class="mark-highlight-manual" property="dct:title">\${autonummer}</span>
          <span property="https://data.vlaanderen.be/ns/mobiliteit#standaardwaarde">123</span>
        </span>
        dan 
        <span resource="http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE5" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
          <span class="mark-highlight-manual" property="dct:title">\${tekst}</span>
          <span property="https://data.vlaanderen.be/ns/mobiliteit#standaardwaarde">Tekst_1</span>
        </span>
        codelijst van 
        <span resource="http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE6" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
          <span property="dct:type" content="codelist"></span>   
          <span property="dct:source" resource="http://example.com/sparql"></span>
          <span property="ext:codelist" resource="http://lblod.data.gift/concept-schemes/61C054CEE3249100080000B9"></span>
          <span class="mark-highlight-manual" property="dct:title">\${codelijst}</span>
          <span property="https://data.vlaanderen.be/ns/mobiliteit#standaardwaarde">Codelijst_1</span>
        </span>
        en ook nog is een datum eh 
        <span resource="http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE7" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
          <span property="dct:type" content="date"></span>  
          <span class="mark-highlight-manual" property="dct:title">\${datum}</span>
          <span property="https://data.vlaanderen.be/ns/mobiliteit#standaardwaarde" datatype="xsd:date">2021-01-01</span>
        </span>
        
        <span resource="http://data.lblod.info/mappings/649D79A34E5B47D5A3A1EE0F" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
          <span class="mark-highlight-manual" property="dct:title">\${cijferstesten}</span>
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
      const expected = annotatedArray.map((entry) => { return {...entry, annotated: normalize(entry.annotated)} });
      const result = generateAnnotatedTemplates(data).map((entry) => { return {...entry, annotated: normalize(entry.annotated)} });
      assert.deepStrictEqual(result, expected);
    });
  });
});
