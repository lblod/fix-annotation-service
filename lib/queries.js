import { sparqlEscapeString, sparqlEscapeUri } from "mu";
import { querySudo as query, updateSudo as update } from "@lblod/mu-auth-sudo";

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
 * Fetches templates and variables from the database.
 *
 * If no templateUris are provided, all templates will be fetched.
 * @param {string[]} [templateUris] - The URIs of the templates to be fetched.
 * @returns {Promise<SparqlSelectTemplatesResponse>} The response object containing the bindings.
 */
export const getTemplatesAndVariables = async (templateUris) => {
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
  
    SELECT DISTINCT ?uri ?templateValue ?variableUri ?variableType ?variableValue ?variableDefaultValue ?variableCodelist ?annotatedTemplate WHERE {
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
        OPTIONAL {
          ?variableUri mobiliteit:template ?template.
          ?template ext:annotated ?annotatedTemplate
        }
      }
    }
    `;

  return query(selectTemplateQuery);
};

/**
 * Fetches all template URIs containing annotated template.
 *
 * @returns {Promise<string[]>} An array containing the URIs of templates with annotated.
 */
export const getAllAnnotatedTemplateUris = async () => {
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
 * Updates annotated templates in the database.
 *
 * @param {{ uri: string, annotated: string }[]} annotatedArray - The array containing the annotated templates.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
export const updateAnnotated = async (annotatedArray) => {
  const updateQuery = `
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

  await update(updateQuery);
};

/**
 * Deletes annotated templates in the database.
 *
 * @param {string[]} uris - The array containing the uris of the annotated templates.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
export const deleteAnnotated = async (uris) => {
  const deletes = uris
    .map(
      (uri) =>
        `DELETE WHERE {
            GRAPH <http://mu.semte.ch/graphs/mow/registry> {
              <${uri}> ext:annotated ?template .
            }
          };\n`
    )
    .join(" ");

  const deleteQuery = `
        PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
  
        ${deletes}
        `;

  await update(deleteQuery);
};

export const getLinkedTemplates = async (templateUris) => {
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
  
    SELECT DISTINCT ?linkedTemplateUri WHERE {
      ${values}
  
      ?variableUri mobiliteit:template ?uri.
      ?linkedTemplateUri mobiliteit:variabele ?variableUri .

      ?uri a mobiliteit:Template ;
        prov:value ?templateValue .
    }
    `;

  const queryResult = await query(selectTemplateQuery);
  return queryResult.results.bindings.map(
    (binding) => binding.linkedTemplateUri.value
  );
};
