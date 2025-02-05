import { SPARQL_ENDPOINT } from "../config.js";
import {
  generateCodelistTemplate,
  generateDateTemplate,
  generateLocationTemplate,
  generateTextTemplate,
} from "./templates.js";

/**
 * @typedef {Object} Template
 * @property {string} uri - The URI of the template.
 * @property {string} templateValue - The value of the template.
 * @property {TemplateVariable[]} variables - The variables of the template.
 */
/**
 * @typedef {Object} TemplateVariable
 * @property {string} uri - The URI of the variable.
 * @property {string} label - The name of the variable.
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
        label: binding.variableLabel.value,
        type: binding.variableType.value,
        ...(binding.variableDefaultValue && {
          defaultValue: binding.variableDefaultValue.value,
        }),
        ...(binding.variableCodelist && {
          codelist: binding.variableCodelist.value,
        }),
        ...(binding.annotatedTemplate && {
          annotatedTemplate: binding.annotatedTemplate.value,
        }),
      };

      data[uri].variables.push(variable);
    }
  }

  return Object.values(data);
};

/**
 * Generates an array of annotated templates.
 *
 * @param {Template[]} templates - The templates to be annotated.
 * @returns {{ uri: string, annotated: string }[]} An array containing the annotated templates.
 */
export const generateAnnotatedTemplates = (templates) => {
  return templates.map(({ uri, templateValue, variables }) => {
    return {
      uri,
      annotated: applyTemplateMappings(templateValue, variables),
    };
  });
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
    instruction: (variable) => variable.annotatedTemplate,
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
    const regex = new RegExp(`\\\${${variable.label}}`, "g");
    const generator =
      templateGenerators[variable.type] || templateGenerators.default;

    annotatedTemplate = annotatedTemplate.replace(regex, generator(variable));
  }

  return annotatedTemplate;
};
