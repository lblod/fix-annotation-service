import assert from "assert";
import esmock from "esmock";

const {
  parseSelectTemplateBindings,
} = await esmock.strict("../../lib/process-template-preview.js", {
  "../../config.js": {
    SPARQL_ENDPOINT: "http://example.com/sparql",
  },
});

// 1. Mock the response from the SPARQL query
import templateReponse from "../mocks/select-template-response.js";
import { generateTemplatePreview, generateTemplatePreviews } from "../../lib/process-template-preview.js";

// 2. Paresed bindings from the response
const parsedBinding = [
  {
    uri: "http://data.lblod.info/templates/67476E5D5A9960633226D2AB",
    value:
      "Een locatie: ${locatie}. Eerste instructie: ${instructie1}. Een nummer: ${autonummer}. Een tekst: ${tekst}. Een codelijst: ${codelijst}. Nog een datum: ${datum}. En een laatste instructie: ${instructie2}.",
    variables: [
      {
        uri: "http://data.lblod.info/variables/67476E5D5A9960633226D2AF",
        type: "codelist",
        label: "codelijst",
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
        uri: "http://data.lblod.info/variables/86B450226570C2C31195B303",
        type: "instruction",
        label: "instructie1",
        templatePreview: "Instructie met wat info ${instructie1_datum}, ${instructie1_cijfer}",
      },
      {
        uri: "http://data.lblod.info/variables/75DAA60360D332CAF8517419",
        type: "instruction",
        label: "instructie2",
        templatePreview: "Tweede instructie met wat info ${instructie2_locatie}, ${instructie2_datum}",
      },
    ],
  },
  {
    value: "de fietszone wordt afgebakend",
    uri: "http://data.lblod.info/templates/643003B35BDCDA240120BDCB",
    variables: [],
  },
];

// 3. Previews to be generated
const previewArray = [
  {
    uri: "http://data.lblod.info/templates/67476E5D5A9960633226D2AB",
    preview:
      "Een locatie: ${locatie}. Eerste instructie: Instructie met wat info ${instructie1_datum}, ${instructie1_cijfer}. Een nummer: ${autonummer}. Een tekst: ${tekst}. Een codelijst: ${codelijst}. Nog een datum: ${datum}. En een laatste instructie: Tweede instructie met wat info ${instructie2_locatie}, ${instructie2_datum}.",
  },
  {
    uri: "http://data.lblod.info/templates/643003B35BDCDA240120BDCB",
    preview: "de fietszone wordt afgebakend",
  },
];

describe("process template previews", () => {
  describe("parseSelectTemplateBindings", () => {
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

  describe("generateTemplatePreview", () => {
    it("should include variables (instructions) in the template", () => {
      const template = {
        uri: "http://example.com",
        value:
          "Een locatie: ${locatie}. Eerste instructie: ${instructie1}. Een nummer: ${autonummer}. Een tekst: ${tekst}. Een codelijst: ${codelijst}. Nog een datum: ${datum}. En een laatste instructie: ${instructie2}.",
        variables: [
          {
            uri: "http://data.lblod.info/mappings/6486F5D44E5B47D5A3A1EDE3",
            label: "locatie",
            type: "location",
          },
          {
            uri: "http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE4",
            label: "autonummer",
            type: "number",
          },
          {
            uri: "http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE5",
            label: "tekst",
            type: "text",
          },
          {
            uri: "http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE6",
            label: "codelijst",
            type: "codelist",
            codelist:
              "http://lblod.data.gift/concept-schemes/61C054CEE3249100080000B9",
          },
          {
            uri: "http://data.lblod.info/mappings/6486F5D54E5B47D5A3A1EDE7",
            label: "datum",
            type: "date",
          },
          {
            uri: "http://data.lblod.info/variables/86B450226570C2C31195B303",
            type: "instruction",
            label: "instructie1",
            templatePreview: "Instructie met wat info ${instructie1_datum}, ${instructie1_cijfer}",
          },
          {
            uri: "http://data.lblod.info/variables/75DAA60360D332CAF8517419",
            type: "instruction",
            label: "instructie2",
            templatePreview: "Tweede instructie met wat info ${instructie2_locatie}, ${instructie2_datum}",
          },
        ],
      };
      const expected = "Een locatie: ${locatie}. Eerste instructie: Instructie met wat info ${instructie1_datum}, ${instructie1_cijfer}. Een nummer: ${autonummer}. Een tekst: ${tekst}. Een codelijst: ${codelijst}. Nog een datum: ${datum}. En een laatste instructie: Tweede instructie met wat info ${instructie2_locatie}, ${instructie2_datum}.";
      const result = generateTemplatePreview(
        template.value,
        template.variables
      );
      assert.strictEqual(result, expected);
    });
  });

  describe("generateTemplatePreviews", () => {
    it("should generate template previews", () => {
      const data = parsedBinding;
      const expected = previewArray;
      const result = generateTemplatePreviews(data);
      assert.deepStrictEqual(result, expected);
    });
  });
});
