/**
 * @typedef {Object} Template
 * @property {string} uri - The URI of the template.
 * @property {string} value - The value of the template.
 * @property {TemplateVariable[]} variables - The variables of the template.
 */
/**
 * @typedef {Object} TemplateVariable
 * @property {string} uri - The URI of the variable.
 * @property {string} label - The name of the variable.
 * @property {string} type - The type of the variable.
 * @property {string} [templatePreview] - The preview of the template representing the variable (in case of instructions) (optional).
 */

import { VARIABLE_TYPES } from "../constants.js";

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
        value: binding.templateValue?.value ?? "",
        variables: [],
      };
    }

    // Add the variable to the data object
    if (binding.variableUri) {
      const variable = {
        uri: binding.variableUri.value,
        label: binding.variableLabel.value,
        type: binding.variableType.value,
        ...(binding.variableTemplatePreview && {
          templatePreview: binding.variableTemplatePreview.value,
        }),
      };

      data[uri].variables.push(variable);
    }
  }

  return Object.values(data);
};

/**
 * Generates an array of template previews.
 *
 * @param {Template[]} templates - The templates to generate a preview for.
 * @returns {{ uri: string, preview: string }[]} An array containing the template previews.
 */
export const generateTemplatePreviews = (templates) => {
  return templates.map(({ uri, value, variables }) => {
    return {
      uri,
      preview: generateTemplatePreview(value, variables),
    };
  });
};

/**
 * Applies the variables to the template and generates the template previews.
 *
 * @param {string} basicTemplate - The basic template string.
 * @param {TemplateVariable[]} variables - The variables to be mapped.
 * @returns {string} The template preview string.
 */
export const generateTemplatePreview = (basicTemplate, variables) => {
  let templatePreview = basicTemplate;

  const templateGenerators = {
    [VARIABLE_TYPES.INSTRUCTION]: (variable) => variable.templatePreview,
    // I realize this is redundant, but left it in for future-proofing
    default: (variable) => `\${${variable.label}}`
  };
  for (const variable of variables) {
    const regex = new RegExp(`\\\${${variable.label}}`, "g");
    const generator =
      templateGenerators[variable.type] || templateGenerators.default;

    templatePreview = templatePreview.replace(regex, generator(variable));
  }

  return templatePreview;
};
