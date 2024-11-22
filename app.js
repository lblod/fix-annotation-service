import { app, errorHandler, sparqlEscapeString } from "mu";
import { querySudo as query, updateSudo as update } from "@lblod/mu-auth-sudo";

app.get("/", function (_req, res) {
  res.send("Hello mu-javascript-template");
});

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

  }`;

  try {
    const response = await query(myQuery);
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

function generateAnnotatedArray(data) {
  return data.map((template) => {
    return {
      uri: template.uri,
      annotated: includeMappings(template.templateValue, template.mappings),
    };
  });
}

function generateTextTemplate(uri, name) {
  return `
    <span typeof="ext:Mapping" resource="${uri}">
      <span class="mark-highlight-manual">\${${name}}</span>
    </span>
  `;
}

function generateCodelistTemplate(uri, name, codelist) {
  return `
    <span resource="${uri}" typeof="ext:Mapping">
      <span property="dct:source" resource="${process.env.SPARQL_ENDPOINT}"></span>
      <span property="dct:type" content="codelist"></span>
      <span property="ext:codelist" resource="${codelist}"></span>
      <span property="ext:content">\${${name}}</span>
    </span>
  `;
}

function generateLocationTemplate(uri, name) {
  return `
    <span resource="${uri}" typeof="ext:Mapping">
      <span property="dct:source" resource="${process.env.SPARQL_ENDPOINT}"></span>
      <span property="dct:type" content="location"></span>
      <span property="ext:content">\${${name}}</span>
    </span>
  `;
}

function generateDateTemplate(uri, name) {
  return `
    <span resource="${uri}" typeof="ext:Mapping">
      <span property="dct:type" content="date"></span>
      <span property="ext:content" datatype="xsd:date">\${${name}}</span>
    </span>
  `;
}

function includeMappings(html, mappings) {
  let finalHtml = html;
  for (let mapping of mappings) {
    const regex = new RegExp(`\\\${${mapping.variable}}`, "g");
    if (mapping.type === "instruction") {
      continue;
    } else if (mapping.type === "codelist") {
      const codeList = mapping.codelist;
      finalHtml = finalHtml.replace(
        regex,
        generateCodelistTemplate(mapping.uri, mapping.variable, codeList)
      );
    } else if (mapping.type === "location") {
      finalHtml = finalHtml.replace(
        regex,
        generateLocationTemplate(mapping.uri, mapping.variable)
      );
    } else if (mapping.type === "date") {
      finalHtml = finalHtml.replace(
        regex,
        generateDateTemplate(mapping.uri, mapping.variable)
      );
    } else {
      finalHtml = finalHtml.replace(
        regex,
        generateTextTemplate(mapping.uri, mapping.variable)
      );
    }
  }
  return finalHtml;
}

function parseBindings(bindings) {
  const data = {};
  for (let binding of bindings) {
    const uri = binding.uri.value;
    if (!data[uri]) {
      data[uri] = {
        uri: uri,
        templateValue: binding.templateValue.value || "",
        mappings: [],
      };
    }
    if (binding.mapping) {
      const mapping = {
        uri: binding.mapping.value,
        type: binding.type.value,
        variable: binding.variable.value,
      };
      if (binding.codelist) {
        mapping.codelist = binding.codelist.value;
      }
      data[uri].mappings.push(mapping);
    }
  }
  const dataArray = [];
  for (let key in data) {
    dataArray.push(data[key]);
  }
  return dataArray;
}

function generateUpdateQuery(annotatedArray) {
  return `
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    ${annotatedArray
      .map(
        (template) => `
      DELETE WHERE {
        GRAPH <http://mu.semte.ch/graphs/mow/registry> { 
          <${template.uri}> ext:annotated ?template.
        }
      };
    `
      )
      .join(" ")}

    INSERT DATA {
      GRAPH <http://mu.semte.ch/graphs/mow/registry> {
        ${annotatedArray
          .map(
            (template) =>
              `<${template.uri}> ext:annotated ${sparqlEscapeString(
                template.annotated
              )}.`
          )
          .join(" ")}
      }
    }
  `;
}

app.post("/fixAnnotated", fetchAndUpdateAnnotations);

app.use(errorHandler);
