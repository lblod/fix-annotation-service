import { app, errorHandler, sparqlEscapeString } from 'mu';
import { querySudo as query, updateSudo as update } from '@lblod/mu-auth-sudo';

const GET_TEMPLATES_QUERY = `
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  PREFIX dct: <http://purl.org/dc/terms/>
  PREFIX prov: <http://www.w3.org/ns/prov#>
  PREFIX mobiliteit: <https://data.vlaanderen.be/ns/mobiliteit#>
  PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>


  SELECT DISTINCT ?uri ?templateValue  ?type ?variableUri ?variableLabel ?variableValue ?variableDefaultValue ?codelist WHERE {
    ?uri a mobiliteit:Template;
    prov:value ?templateValue.


  OPTIONAL {
    ?uri mobiliteit:variabele ?variableUri.
    ?variableUri dct:type ?type.
    OPTIONAL {
      ?variableUri dct:title ?variableLabel.
    }
    OPTIONAL {
      ?variableUri rdfs:value ?variableValue.
    }
    OPTIONAL {
      ?variableUri mobiliteit:standaardwaarde ?variableDefaultValue.
    }
 
    OPTIONAL {
      ?variableUri ext:codeList ?codelist.
    }
  }

  }`;

app.get('/', function (_, res) {
  res.send('Hello mu-javascript-template');
});

app.post('/fixAnnotated', async function (_, res) {

  try {
    const response = await query(GET_TEMPLATES_QUERY);
    const data = parseBindings(response.results.bindings);
    const annotatedArray = generateAnnotatedArray(data);
    const slicedArray = sliceArray(annotatedArray, 10);
    for (const array of slicedArray) {
      const updateQuery = generateUpdateQuery(array);
      await update(updateQuery);
    }
    res.end('Done');

  } catch (err) {
    console.log(err);
    res.send("Oops something went wrong: " + err);
  }

});

function sliceArray(array, chunkSize) {
  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    let chunk = array.slice(i, i + chunkSize);
    result.push(chunk);
  }
  return result;
}

function generateAnnotatedArray(data) {

  return data.map((template) => {
    return {
      uri: template.uri,
      annotated: includeVariables(template.templateValue, template.variables)
    };
  });
}

function generateTextTemplate(uri, value, defaultValue) {
  return `
    <span typeof="mobiliteit:Variabele" resource="${uri}">
      <span class="mark-highlight-manual" property="rdfs:value">\${${value}}</span>
      ${!defaultValue?.length ? "" : `<span property="mobiliteit:standaardwaarde">${defaultValue}</span>`}
    </span>
  `;
}

function generateCodelistTemplate(uri, value, defaultValue, codelist) {
  return `
    <span resource="${uri}" typeof="mobiliteit:Variabele">
      <span property="dct:source" resource="${process.env.SPARQL_ENDPOINT}"></span>
      <span property="dct:type" content="codelist"></span>
      <span property="ext:codelist" resource="${codelist}"></span>
      <span property="rdfs:value">\${${value}}</span>
      ${!defaultValue?.length ? "" : `<span property="mobiliteit:standaardwaarde">${defaultValue}</span>`}
    </span>
  `;
}

function generateLocationTemplate(uri, value, defaultValue) {
  return `
    <span resource="${uri}" typeof="mobiliteit:Variabele">
      <span property="dct:source" resource="${process.env.SPARQL_ENDPOINT}"></span>
      <span property="dct:type" content="location"></span>
      <span property="rdfs:value">\${${value}}</span>
      ${!defaultValue?.length ? "" : `<span property="mobiliteit:standaardwaarde">${defaultValue}</span>`}

    </span>
  `;
}

function generateDateTemplate(uri, value, defaultValue) {
  return `
    <span resource="${uri}" typeof="mobiliteit:Variabele">
      <span property="dct:type" content="date"></span>
      <span property="rdfs:value" datatype="xsd:date">\${${value}}</span>
      ${!defaultValue?.length ? "" : `<span property="mobiliteit:standaardwaarde">${defaultValue}</span>`}

    </span>
  `;
}

function includeVariables(html, variables) {
  let finalHtml = html;
  for (let variable of variables) {
    const regex = new RegExp(`\\\${${variable.value}}`, 'g');
    if (variable.type === 'instruction') {
      continue;
    } else if (variable.type === 'codelist') {
      const codeList = variable.codelist;
      finalHtml = finalHtml.replace(
        regex,
        generateCodelistTemplate(variable.uri, variable.value, variable.defaultValue, codeList)
      );
    } else if (variable.type === 'location') {
      finalHtml = finalHtml.replace(
        regex,
        generateLocationTemplate(variable.uri, variable.value, variable.defaultValue)
      );
    } else if (variable.type === 'date') {
      finalHtml = finalHtml.replace(
        regex,
        generateDateTemplate(variable.uri, variable.value, variable.defaultValue)
      );
    } else {
      finalHtml = finalHtml.replace(
        regex,
        generateTextTemplate(variable.uri, variable.value, variable.defaultValue)
      );
    }
  }
  return finalHtml;
}


function parseBindings(bindings) {
  const data = {};
  for (const binding of bindings) {
    const uri = binding.uri.value;
    if (!data[uri]) {
      data[uri] = {
        uri: uri,
        templateValue: binding.templateValue?.value || '',
        variables: [],
      };
    }
    if (binding.variableUri) {
      const variable = {
        type: binding.type.value,
        uri: binding.variableUri.value,
        label: binding.variableLabel?.value,
        value: binding.variableValue?.value,
        defaultValue: binding.variableDefaultValue?.value,
        codelist: binding.codelist?.value
      };
      data[uri].variables.push(variable);
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
    ${annotatedArray.map((template) => `
      DELETE WHERE {
        GRAPH <http://mu.semte.ch/graphs/mow/registry> { 
          <${template.uri}> ext:annotated ?template.
        }
      };
    `).join(' ')}

    INSERT DATA {
      GRAPH <http://mu.semte.ch/graphs/mow/registry> {
        ${annotatedArray.map((template) => `<${template.uri}> ext:annotated ${sparqlEscapeString(template.annotated)}.`).join(' ')}
      }
    }
  `;
}

app.use(errorHandler);
