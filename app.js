import { app, errorHandler, sparqlEscapeString, sparqlEscapeUri } from "mu";
import { querySudo as query, updateSudo as update } from "@lblod/mu-auth-sudo";
import { SPARQL_ENDPOINT } from "./config.js";
import bodyParser from "body-parser";

/**
 * @typedef {Object} SparqlSelectTemplatesBinding
 * @property {SparqlValue} uri - The URI object
 * @property {SparqlValue} templateValue - The template value object
 * @property {SparqlValue} [variableUri] - The variable URI object (optional)
 * @property {SparqlValue} [variableType] - The variable type object (optional)
 * @property {SparqlValue} [variableValue] - The variable name object (optional)
 * @property {SparqlValue} [variableDefaultValue] - The variable default value object (optional)
 * @property {SparqlValue} [variableCodelist] - The variable codelist object (optional)
 */

/**
 * @typedef {Object} SparqlSelectTemplatesResponse
 * @property {Object} results - The results object
 * @property {SparqlSelectTemplatesBinding[]} results.bindings - The list of bindings
 * @property {SparqlHead} head - The head object
 */

/**
 * Fetches template data from the SPARQL endpoint.
 *
 * If no templateUris are provided, all templates will be fetched.
 * @param {string[]} [templateUris] - The URIs of the templates to be fetched.
 * @returns {Promise<SparqlSelectTemplatesResponse>} The response object containing the bindings.
 */
const fetchTemplateData = async (templateUris) => {
  if (templateUris && !Array.isArray(templateUris)) {
    throw new Error("templateUris must be an array of strings.");
  }

  const values = templateUris?.length
    ? `VALUES ?uri {${templateUris
        .map((uri) => sparqlEscapeUri(uri))
        .join(" ")}}`
    : "";

  const selectTemplateQuery = `
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  PREFIX dct: <http://purl.org/dc/terms/>
  PREFIX prov: <http://www.w3.org/ns/prov#>
  PREFIX mobiliteit: <https://data.vlaanderen.be/ns/mobiliteit#>
  PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>

  SELECT DISTINCT ?uri ?templateValue ?variableUri ?variableType ?variableValue ?variableDefaultValue ?variableCodelist WHERE {
    ${values}

    ?uri a mobiliteit:Template ;
      prov:value ?templateValue .

    OPTIONAL {
      ?uri mobiliteit:variabele ?variableUri .
      ?variableUri dct:type ?variableType ;
        rdf:value ?variableValue .

      OPTIONAL {
        ?variableUri mobiliteit:standaardwaarde ?variableDefaultValue .
      }
      OPTIONAL {
        ?variableUri ext:codeList ?variableCodelist .
      }
    }
  }
  `;

  return query(selectTemplateQuery);
};

/**
 * @typedef {Object} Template
 * @property {string} uri - The URI of the template.
 * @property {string} templateValue - The value of the template.
 * @property {TemplateVariable[]} variables - The variables of the template.
 */
/**
 * @typedef {Object} TemplateVariable
 * @property {string} uri - The URI of the variable.
 * @property {string} value - The name of the variable.
 * @property {string} type - The type of the variable.
 * @property {string} [defaultValue] - The default value of the variable (optional).
 * @property {string} [codelist] - The codelist of the variable (optional).
 */
/**
 * Parses the bindings from the SPARQL response and organizes them into a more
 * structured format.
 * @param {SparqlSelectTemplatesBinding[]} bindings - The bindings to be parsed.
 * @returns {Template[]} An array containing the parsed bindings.
 */
export const parseSelectTemplateBindings = (bindings) => {
  const data = {};
  for (const binding of bindings) {
    const uri = binding.uri.value;

    // Add default values if the uri is not in the data object
    if (!data[uri]) {
      data[uri] = {
        uri,
        templateValue: binding.templateValue?.value ?? "",
        variables: [],
      };
    }

    // Add the variable to the data object
    if (binding.variableUri) {
      const variable = {
        uri: binding.variableUri.value,
        value: binding.variableValue.value,
        type: binding.variableType.value,
        ...(binding.variableDefaultValue && {
          defaultValue: binding.variableDefaultValue.value,
        }),
        ...(binding.variableCodelist && {
          codelist: binding.variableCodelist.value,
        }),
      };

      data[uri].variables.push(variable);
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
 *
 * @param {Object} variable - The object containing the variable data.
 * @param {string} variable.uri - The URI of the variable.
 * @param {string} variable.value - The name of the variable.
 * @param {string} [variable.defaultValue] - The default value of the variable (optional).
 * @returns {string} The text template string.
 */
const generateTextTemplate = ({ uri, value, defaultValue }) => {
  return `
    <span resource="${uri}" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
      <span class="mark-highlight-manual" property="rdf:value">\${${value}}</span>
      ${
        !defaultValue?.length
          ? ""
          : `<span property="https://data.vlaanderen.be/ns/mobiliteit#standaardwaarde">${defaultValue}</span>`
      }
    </span>
  `;
};

/**
 * Generates a codelist template.
 *
 * @param {Object} variable - The object containing the variable data.
 * @param {string} variable.uri - The URI of the variable.
 * @param {string} variable.value - The name of the variable.
 * @param {string} variable.codelist - The codelist of the variable.
 * @param {string} variable.source - The source of the variable.
 * @param {string} [variable.defaultValue] - The default value of the variable (optional).
 */
const generateCodelistTemplate = ({
  uri,
  value,
  codelist,
  source,
  defaultValue,
}) => {
  return `
    <span resource="${uri}" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
      <span property="dct:type" content="codelist"></span>
      <span property="dct:source" resource="${source}"></span>
      <span property="ext:codelist" resource="${codelist}"></span>
      <span class="mark-highlight-manual" property="rdf:value">\${${value}}</span>
      ${
        !defaultValue?.length
          ? ""
          : `<span property="https://data.vlaanderen.be/ns/mobiliteit#standaardwaarde">${defaultValue}</span>`
      }
    </span>
  `;
};

/**
 * Generates a location template.
 *
 * @param {Object} variable - The object containing the variable data.
 * @param {string} variable.uri - The URI of the variable.
 * @param {string} variable.value - The name of the variable.
 * @param {string} variable.source - The source of the variable.
 * @param {string} [variable.defaultValue] - The default value of the variable (optional).
 * @returns {string} The location template string.
 */
const generateLocationTemplate = ({ uri, value, source, defaultValue }) => {
  return `
    <span resource="${uri}" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
      <span property="dct:type" content="location"></span>
      <span property="dct:source" resource="${source}"></span>
      <span class="mark-highlight-manual" property="rdf:value">\${${value}}</span>
      ${
        !defaultValue?.length
          ? ""
          : `<span property="https://data.vlaanderen.be/ns/mobiliteit#standaardwaarde">${defaultValue}</span>`
      }
    </span>
  `;
};

/**
 * Generates a date template.
 *
 * @param {Object} variable - The object containing the variable data.
 * @param {string} variable.uri - The URI of the variable.
 * @param {string} variable.value - The name of the variable.
 * @param {string} [variable.defaultValue] - The default value of the variable (optional).
 * @returns {string} The date template string.
 */
const generateDateTemplate = ({ uri, value, defaultValue }) => {
  return `
    <span resource="${uri}" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
      <span property="dct:type" content="date"></span>
      <span class="mark-highlight-manual" property="rdf:value" datatype="xsd:date">\${${value}}</span>
      ${
        !defaultValue?.length
          ? ""
          : `<span property="https://data.vlaanderen.be/ns/mobiliteit#standaardwaarde" datatype="xsd:date">${defaultValue}</span>`
      }
    </span>
  `;
};

/**
 * Applies the mappings to the template and generates the annotated template.
 *
 * @param {string} basicTemplate - The basic template string.
 * @param {TemplateVariable[]} variables - The variables to be mapped.
 * @returns {string} The annotated template string.
 */
export const applyTemplateMappings = (basicTemplate, variables) => {
  let annotatedTemplate = basicTemplate;

  const templateGenerators = {
    codelist: (variable) =>
      generateCodelistTemplate({
        ...variable,
        source: SPARQL_ENDPOINT,
      }),
    location: (variable) =>
      generateLocationTemplate({
        ...variable,
        source: SPARQL_ENDPOINT,
      }),
    date: generateDateTemplate,
    default: generateTextTemplate,
  };
  for (const variable of variables) {
    if (variable.type === "instruction") continue;

    const regex = new RegExp(`\\\${${variable.value}}`, "g");
    const generator =
      templateGenerators[variable.type] || templateGenerators.default;

    annotatedTemplate = annotatedTemplate.replace(regex, generator(variable));
  }

  return annotatedTemplate;
};

/**
 * Generates an annotated array based on the templates.
 * @param {Template[]} templates - The templates to be annotated.
 * @returns {Object[]} An array containing the annotated templates.
 */
export const generateAnnotatedArray = (templates) => {
  return templates.map(({ uri, templateValue, variables }) => {
    return {
      uri,
      annotated: applyTemplateMappings(templateValue, variables),
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

const processTemplateAnnotations = async (bindings) => {
  const data = parseSelectTemplateBindings(bindings);
  const annotatedArray = generateAnnotatedArray(data);
  const chunkedAnnotatedArray = splitIntoChunks(annotatedArray, 10);
  for (let chunkedTemplates of chunkedAnnotatedArray) {
    const updateQuery = generateUpdateQuery(chunkedTemplates);
    await update(updateQuery);
  }
};

/**
 * Fetches and updates all annotations.
 *
 * This function executes a SPARQL query to fetch all template data, processes the data,
 * and updates the annotations in batches.
 *
 * @param {import('express').Request} _req - The Express request object (not used in this function).
 * @param {import('express').Response} res - The Express response object used to send the response.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const fetchAndUpdateAllAnnotations = async (_req, res) => {
  try {
    const response = await fetchTemplateData();
    if (!response.results.bindings.length) {
      return res.send("No templates found");
    }

    await processTemplateAnnotations(response.results.bindings);
    res.end("Done");
  } catch (err) {
    res.send("Oops something went wrong: " + err);
    console.log(err);
  }
};

/**
 * Fetches all annotated templates from the registry graph.
 *
 * @returns {Promise<string[]>} An array containing the URIs of templates with annotated.
 */
const fetchAllTemplatesWithAnnotated = async () => {
  const selectTemplateWithAnnotatedQuery = `
  PREFIX mobiliteit: <https://data.vlaanderen.be/ns/mobiliteit#>
  PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>

  SELECT DISTINCT ?uri WHERE {
    GRAPH <http://mu.semte.ch/graphs/mow/registry> {
      ?uri a mobiliteit:Template ;
        ext:annotated ?annotated .
    }
  }
  `;

  const response = await query(selectTemplateWithAnnotatedQuery);

  return response.results.bindings.map((binding) => binding.uri.value);
};

/**
 * Return delete annotated templates query.
 * @param {string[]} uris - The array containing the uris of the annotated templates.
 * @returns {string} The query string.
 */
const deleteChuckQuery = (uris) => {
  return uris
    .map(
      (uri) =>
        `DELETE WHERE {
          GRAPH <http://mu.semte.ch/graphs/mow/registry> {
            <${uri}> ext:annotated ?template .
          }
        };\n`
    )
    .join(" ");
};

/**
 * Resets all annotated templates in the registry graph.
 *
 * @param {import('express').Request} _req - The Express request object (not used in this function).
 * @param {import('express').Response} res - The Express response object used to send the response.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const clearAnnotatedTemplate = async (_req, res) => {
  try {
    const templateUris = await fetchAllTemplatesWithAnnotated();
    const chunkedTemplateUris = splitIntoChunks(templateUris, 10);

    for (let uris of chunkedTemplateUris) {
      const updateQuery = `
      PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>

      ${deleteChuckQuery(uris)}
      `;

      await update(updateQuery);
    }

    res.end("Done");
  } catch (err) {
    res.send("Oops something went wrong: " + err);
    console.error(err);
  }
};

/**
 * Extracts URIs (subject value) from the delta inserts.
 *
 * @param {Object[]} deltas - The array of deltas.
 * @returns {string[]} The array containing the URIs of the inserts.
 */
export const extractInsertUris = (deltas) => {
  const uris = deltas
    .map(({ inserts }) => inserts.map(({ subject }) => subject.value))
    .flat();

  return [...new Set(uris)];
};

const updateAnnotationsFromDelta = async (req, res) => {
  console.log("Received delta request");
  console.log(req.get("content-type"));
  console.log(JSON.stringify(req.body));

  // check if the body contains delta
  if (!req.body || !req.body.length) {
    console.log("No delta found");
    return res.status(202).send();
  }

  const updatedUris = extractInsertUris(req.body);
  const templates = await fetchTemplateData(updatedUris);
  if (!templates.results.bindings.length) {
    return res.send("No templates found");
  }

  await processTemplateAnnotations(templates.results.bindings);

  return res.status(202).send();
};

app.post(
  "/delta",
  bodyParser.json({ limit: "500mb" }),
  updateAnnotationsFromDelta
);

app.post("/fixAnnotated", fetchAndUpdateAllAnnotations);

app.post("/clear-annotated", clearAnnotatedTemplate);

app.use(errorHandler);
