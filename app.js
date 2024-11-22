import { app, errorHandler, sparqlEscapeString } from "mu";
import { querySudo as query, updateSudo as update } from "@lblod/mu-auth-sudo";

app.get("/", function (_req, res) {
  res.send("Hello mu-javascript-template");
});

/**
 * @typedef {Object} SparqlSelectTemplatesBinding
 * @property {SparqlValue} variable - The variable object
 * @property {SparqlValue} uri - The URI object
 * @property {SparqlValue} type - The type object
 * @property {SparqlValue} templateValue - The template value object
 * @property {SparqlValue} mapping - The mapping object
 * @property {SparqlValue} [codelist] - The codelist object (optional)
 */

/**
 * @typedef {Object} SparqlSelectTemplatesResponse
 * @property {Object} results - The results object
 * @property {SparqlSelectTemplatesBinding[]} results.bindings - The list of bindings
 * @property {SparqlHead} head - The head object
 */

/**
 * Fetches template data from the SPARQL endpoint.
 * @returns {Promise<SparqlSelectTemplatesResponse>} The response object containing the bindings.
 */
const fetchTemplateData = async () => {
  var myQuery = `
    PREFIX ex: <http://example.org#>
    PREFIX lblodMobilitiet: <http://data.lblod.info/vocabularies/mobiliteit/>
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    PREFIX sh: <http://www.w3.org/ns/shacl#>
    PREFIX oslo: <http://data.vlaanderen.be/ns#>
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX org: <http://www.w3.org/ns/org#>
    PREFIX mobiliteit: <https://data.vlaanderen.be/ns/mobiliteit#>

  SELECT DISTINCT ?uri ?templateValue ?mapping ?type ?variable ?codelist WHERE {
    ?uri a ext:Template;
    ext:value ?templateValue.


  OPTIONAL {
    ?uri ext:mapping ?mapping.
    ?mapping ext:variableType ?type;
            ext:variable ?variable.
    OPTIONAL {
      ?mapping ext:codeList ?codelist.
    }
  }
  `;

  return query(myQuery);
};

/**
 * Parses the bindings from the SPARQL response and organizes them into a more
 * structured format.
 * @param {SparqlSelectTemplatesBinding[]} bindings - The bindings to be parsed.
 * @returns {Object[]} An array containing the parsed bindings.
 */
export const parseBindings = (bindings) => {
  const data = {};
  for (let binding of bindings) {
    const uri = binding.uri.value;

    // Add default values if the uri is not in the data object
    if (!data[uri]) {
      data[uri] = {
        uri: uri,
        templateValue: binding.templateValue.value || "",
        mappings: [],
      };
    }

    // Add the mapping to the data object
    if (binding.mapping) {
      const mapping = {
        uri: binding.mapping.value,
        type: binding.type.value,
        variable: binding.variable.value,
        ...(binding.codelist && { codelist: binding.codelist.value }),
      };

      data[uri].mappings.push(mapping);
    }
  }

  return Object.values(data);
};

/**
 * Splits an array into chunks of a specified size.
 *
 * @param {Array} dataArray - The array to be split into chunks.
 * @param {number} chunkSize - The size of each chunk.
 * @returns {Array[]} An array containing the chunks.
 */
export const splitIntoChunks = (dataArray, chunkSize) => {
  const result = [];
  for (let i = 0; i < dataArray.length; i += chunkSize) {
    let chunk = dataArray.slice(i, i + chunkSize);
    result.push(chunk);
  }
  return result;
};

/**
 * Generates a text template.
 * @param {string} uri - The URI of the mapping.
 * @param {string} name - The name of the variable.
 * @returns {string} The text template string.
 */
const generateTextTemplate = (uri, name) => {
  return `
    <span typeof="ext:Mapping" resource="${uri}">
      <span class="mark-highlight-manual">\${${name}}</span>
    </span>
  `;
};

/**
 * Generates a codelist template.
 * @param {string} uri - The URI of the mapping.
 * @param {string} name - The name of the variable.
 * @param {string} codelist - The URI of the codelist.
 * @param {string} source - The URI of the source.
 * @returns {string} The codelist template string.
 */
const generateCodelistTemplate = (uri, name, codelist, source) => {
  return `
    <span resource="${uri}" typeof="ext:Mapping">
      <span property="dct:source" resource="${source}"></span>
      <span property="dct:type" content="codelist"></span>
      <span property="ext:codelist" resource="${codelist}"></span>
      <span property="ext:content">\${${name}}</span>
    </span>
  `;
};

/**
 * Generates a location template.
 * @param {string} uri - The URI of the mapping.
 * @param {string} name - The name of the variable.
 * @param {string} source - The URI of the source.
 * @returns {string} The location template string.
 */
const generateLocationTemplate = (uri, name, source) => {
  return `
    <span resource="${uri}" typeof="ext:Mapping">
      <span property="dct:source" resource="${source}"></span>
      <span property="dct:type" content="location"></span>
      <span property="ext:content">\${${name}}</span>
    </span>
  `;
};

/**
 * Generates a date template.
 * @param {string} uri - The URI of the mapping.
 * @param {string} name - The name of the variable.
 * @returns {string} The date template string.
 */
const generateDateTemplate = (uri, name) => {
  return `
    <span resource="${uri}" typeof="ext:Mapping">
      <span property="dct:type" content="date"></span>
      <span property="ext:content" datatype="xsd:date">\${${name}}</span>
    </span>
  `;
};

/**
 * Applies the mappings to the template and generates the annotated template.
 *
 * @param {string} basicTemplate - The basic template string.
 * @param {Object[]} mappings - The mappings to be applied to the template.
 * @returns {string} The annotated template string.
 */
export const applyTemplateMappings = (basicTemplate, mappings) => {
  let annotatedTemplate = basicTemplate;

  const templateGenerators = {
    codelist: (mapping) =>
      generateCodelistTemplate(
        mapping.uri,
        mapping.variable,
        mapping.codelist,
        process.env.SPARQL_ENDPOINT
      ),
    location: (mapping) =>
      generateLocationTemplate(
        mapping.uri,
        mapping.variable,
        process.env.SPARQL_ENDPOINT
      ),
    date: (mapping) => generateDateTemplate(mapping.uri, mapping.variable),
    default: (mapping) => generateTextTemplate(mapping.uri, mapping.variable),
  };

  for (let mapping of mappings) {
    if (mapping.type === "instruction") continue;

    const regex = new RegExp(`\\\${${mapping.variable}}`, "g");
    const generator =
      templateGenerators[mapping.type] || templateGenerators.default;

    annotatedTemplate = annotatedTemplate.replace(regex, generator(mapping));
  }

  return annotatedTemplate;
};

export const generateAnnotatedArray = (data) => {
  return data.map((template) => {
    return {
      uri: template.uri,
      annotated: applyTemplateMappings(
        template.templateValue,
        template.mappings
      ),
    };
  });
};

export const generateUpdateQuery = (annotatedArray) => {
  return `
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    ${annotatedArray
      .map(
        (template) => `
      DELETE WHERE {
        GRAPH <http://mu.semte.ch/graphs/mow/registry> { 
          <${template.uri}> ext:annotated ?template .
        }
      };`
      )
      .join(" ")}

    INSERT DATA {
      GRAPH <http://mu.semte.ch/graphs/mow/registry> {
        ${annotatedArray
          .map(
            (template) =>
              `<${template.uri}> ext:annotated ${sparqlEscapeString(
                template.annotated
              )} .\n`
          )
          .join(" ")}
      }
    }
  `;
};

/**
 * Fetches and updates annotations based on a predefined SPARQL query.
 *
 * This function executes a SPARQL query to fetch template data, processes the data,
 * and updates the annotations in batches. It sends a response indicating the completion
 * or an error message if something goes wrong.
 *
 * @param {import('express').Request} _req - The Express request object (not used in this function).
 * @param {import('express').Response} res - The Express response object used to send the response.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const fetchAndUpdateAnnotations = async (_req, res) => {
  try {
    const response = await fetchTemplateData();
    const data = parseBindings(response.results.bindings);
    const annotatedArray = generateAnnotatedArray(data);
    const chunkedAnnotatedArray = splitIntoChunks(annotatedArray, 10);
    for (let chunkedTemplates of chunkedAnnotatedArray) {
      const updateQuery = generateUpdateQuery(chunkedTemplates);
      await update(updateQuery);
    }
    res.end("Done");
  } catch (err) {
    res.send("Oops something went wrong: " + err);
    console.log(err);
  }
};

app.post("/fixAnnotated", fetchAndUpdateAnnotations);

app.use(errorHandler);
