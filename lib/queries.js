import { sparqlEscapeString, sparqlEscapeUri } from "mu";
import { querySudo as query, updateSudo as update } from "@lblod/mu-auth-sudo";

/**
 * @typedef {Object} SparqlSelectTemplatesBinding
 * @property {SparqlValue} uri - The URI object
 * @property {SparqlValue} templateValue - The template value object
 * @property {SparqlValue} [variableUri] - The variable URI object (optional)
 * @property {SparqlValue} [variableType] - The variable type object (optional)
 * @property {SparqlValue} [variableLabel] - The variable name object (optional)
 * @property {SparqlValue} [variableTemplatePreview] - The variable codelist object (optional)
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
  if (templateUris && !templateUris.length) {
    return { results: { bindings: [] } };
  }

  const values = templateUris?.length
    ? `VALUES ?uri {${templateUris
        .map((uri) => sparqlEscapeUri(uri))
        .join(" ")}}`
    : "";

  const selectTemplateQuery = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX mobiliteit: <https://data.vlaanderen.be/ns/mobiliteit#>
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
  
    SELECT DISTINCT ?uri ?templateValue ?variableUri ?variableType ?variableLabel ?variableDefaultValue ?variableTemplatePreview WHERE {
      ${values}
  
      ?uri a mobiliteit:Template ;
        rdf:value ?templateValue .
  
      OPTIONAL {
        ?uri mobiliteit:variabele ?variableUri .
        ?variableUri dct:type ?variableType ;
          dct:title ?variableLabel .
        OPTIONAL {
          ?variableUri mobiliteit:template ?template.
          ?template ext:preview ?variableTemplatePreview.
        }
      }
    }
    `;

  return query(selectTemplateQuery);
};

/**
 * Fetches all template URIs containing previews.
 *
 * @returns {Promise<string[]>} An array containing the URIs of templates with previews.
 */
export const getTemplatesWithPreviews = async () => {
  const selectTemplateWithPreviewQuery = `
    PREFIX mobiliteit: <https://data.vlaanderen.be/ns/mobiliteit#>
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
  
    SELECT DISTINCT ?uri WHERE {
      GRAPH <http://mu.semte.ch/graphs/mow/registry> {
        ?uri a mobiliteit:Template ;
          ext:preview ?preview .
      }
    }
    `;

  const response = await query(selectTemplateWithPreviewQuery);

  return response.results.bindings.map((binding) => binding.uri.value);
};

/**
 * Updates template previews in the database.
 *
 * @param {{ uri: string, preview: string }[]} previewArray - The array containing the templates.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
export const updateTemplatePreviews = async (previewArray) => {
  const updateQuery = `
        PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
        ${previewArray
          .map(
            ({ uri }) => `
          DELETE WHERE {
            GRAPH <http://mu.semte.ch/graphs/mow/registry> { 
              <${uri}> ext:preview ?preview .
            }
          };`
          )
          .join(" ")}
    
        INSERT DATA {
          GRAPH <http://mu.semte.ch/graphs/mow/registry> {
            ${previewArray
              .map(
                ({ uri, preview }) =>
                  `<${uri}> ext:preview ${sparqlEscapeString(
                    preview
                  )} .\n`
              )
              .join(" ")}
          }
        }
      `;

  await update(updateQuery);
};

/**
 * Deletes template previews in the database.
 *
 * @param {string[]} uris - The array containing the uris of the templates.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
export const deleteTemplatePreviews = async (uris) => {
  const deletes = uris
    .map(
      (uri) =>
        `DELETE WHERE {
            GRAPH <http://mu.semte.ch/graphs/mow/registry> {
              <${uri}> ext:preview ?template .
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

/**
 * Fetches all the template uris linked to a array of given uris
 *
 * @param {string[]} uris - The array containing the uris of the templates.
 * @returns {string[]} An array of all the uris of the linked templates.
 */
export const getLinkedTemplates = async (templateUris) => {
  if (templateUris && !Array.isArray(templateUris)) {
    throw new Error("templateUris must be an array of strings.");
  }
  if (!templateUris.length) {
    //If there's no uris given we return no template uris linked
    return [];
  }

  const values = templateUris?.length
    ? `VALUES ?uri {${templateUris
        .map((uri) => sparqlEscapeUri(uri))
        .join(" ")}}`
    : "";

  const selectTemplateQuery = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX mobiliteit: <https://data.vlaanderen.be/ns/mobiliteit#>
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
  
    SELECT DISTINCT ?linkedTemplateUri WHERE {
      ${values}
  
      ?variableUri mobiliteit:template ?uri.
      ?linkedTemplateUri mobiliteit:variabele ?variableUri .

      ?uri a mobiliteit:Template ;
        rdf:value ?templateValue .
    }
    `;

  const queryResult = await query(selectTemplateQuery);
  return queryResult.results.bindings.map(
    (binding) => binding.linkedTemplateUri.value
  );
};
