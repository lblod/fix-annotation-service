/**
 * Generates a text template.
 *
 * @param {Object} variable - The object containing the variable data.
 * @param {string} variable.uri - The URI of the variable.
 * @param {string} variable.label - The name of the variable.
 * @param {string} [variable.defaultValue] - The default value of the variable (optional).
 * @returns {string} The text template string.
 */
export const generateTextTemplate = ({ uri, label, defaultValue }) => {
  return `
    <span resource="${uri}" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
      <span class="mark-highlight-manual" property="dct:title">\${${label}}</span>
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
 * @param {string} variable.label - The name of the variable.
 * @param {string} variable.codelist - The codelist of the variable.
 * @param {string} variable.source - The source of the variable.
 * @param {string} [variable.defaultValue] - The default value of the variable (optional).
 */
export const generateCodelistTemplate = ({
  uri,
  label,
  codelist,
  source,
  defaultValue,
}) => {
  return `
    <span resource="${uri}" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
      <span property="dct:type" content="codelist"></span>
      <span property="dct:source" resource="${source}"></span>
      <span property="ext:codelist" resource="${codelist}"></span>
      <span class="mark-highlight-manual" property="dct:title">\${${label}}</span>
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
 * @param {string} variable.label - The name of the variable.
 * @param {string} variable.source - The source of the variable.
 * @param {string} [variable.defaultValue] - The default value of the variable (optional).
 * @returns {string} The location template string.
 */
export const generateLocationTemplate = ({
  uri,
  label,
  source,
  defaultValue,
}) => {
  return `
    <span resource="${uri}" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
      <span property="dct:type" content="location"></span>
      <span property="dct:source" resource="${source}"></span>
      <span class="mark-highlight-manual" property="dct:title">\${${label}}</span>
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
 * @param {string} variable.label - The name of the variable.
 * @param {string} [variable.defaultValue] - The default value of the variable (optional).
 * @returns {string} The date template string.
 */
export const generateDateTemplate = ({ uri, label, defaultValue }) => {
  return `
    <span resource="${uri}" typeof="https://data.vlaanderen.be/ns/mobiliteit#Variabele">
      <span property="dct:type" content="date"></span>
      <span class="mark-highlight-manual" property="dct:title">\${${label}}</span>
      ${
        !defaultValue?.length
          ? ""
          : `<span property="https://data.vlaanderen.be/ns/mobiliteit#standaardwaarde" datatype="xsd:date">${defaultValue}</span>`
      }
    </span>
  `;
};
