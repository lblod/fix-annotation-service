import { app, errorHandler } from "mu";
import bodyParser from "body-parser";
import {
  getTemplatesAndVariables,
  getLinkedTemplates,
  deleteTemplatePreviews,
  getTemplatesWithPreviews,
  updateTemplatePreviews,
} from "./lib/queries.js";
import {
  generateTemplatePreviews,
  parseSelectTemplateBindings,
} from "./lib/process-template-preview.js";
import { chunkArray, extractInsertUris } from "./lib/utils.js";

/**
 * Processes the template previews.
 *
 * @param {SparqlSelectTemplatesBinding[]} bindings - The bindings from the SPARQL response.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
const processTemplatePreviews = async (bindings) => {
  const templates = parseSelectTemplateBindings(bindings);
  const templatePreviews = generateTemplatePreviews(templates);
  const chunks = chunkArray(templatePreviews, 10);
  for (let chunk of chunks) {
    await updateTemplatePreviews(chunk);
  }
};

/**
 * Updates the templates linked with the uris provided
 *
 * @param {{string[]}} uris -  An array of unique URIs.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
const updateLinkedTemplates = async (uris) => {
  const urisToUpdate = await getLinkedTemplates(uris);
  if (!urisToUpdate.length) {
    //No templates linked to the updated ones
    return;
  }
  const templates = await getTemplatesAndVariables(urisToUpdate);
  return processTemplatePreviews(templates.results.bindings);
};

// updates  template previews based on insertions in the delta
app.post("/delta", bodyParser.json({ limit: "500mb" }), async (req, res) => {
  if (!req.body || !req.body.length) {
    console.log("No delta found");
    return res.status(400).send();
  }

  const updatedUris = extractInsertUris(req.body);
  const templates = await getTemplatesAndVariables(updatedUris);
  if (!templates.results.bindings.length) {
    console.log("No templates found");
    return res.status(404).send();
  }

  // Process templates in the background, returning 202 status immediately to release the connection with the delta-notifier
  processTemplatePreviews(templates.results.bindings).then(() => {
    //When we update a instruction we have to update all the linked templates to ensure consistency
    updateLinkedTemplates(updatedUris);
  });

  return res.status(202).send();
});

// Fetches and updates all template previews
app.post("/update-all", async (_req, res) => {
  try {
    const response = await getTemplatesAndVariables();
    if (!response.results.bindings.length) {
      return res.status(404).send("No templates found");
    }

    await processTemplatePreviews(response.results.bindings);
    //We run it twice to ensure that the templates dependant on templates get updated correctly
    const secondRound = await getTemplatesAndVariables();
    await processTemplatePreviews(secondRound.results.bindings);
    res.end("Done");
  } catch (err) {
    res.status(500).send("Oops something went wrong: " + err);
    console.log(err);
  }
});

// Clear all template previews
app.post("/clear", async (_req, res) => {
  try {
    const templateUris = await getTemplatesWithPreviews();
    const chunkedTemplateUris = chunkArray(templateUris, 10);

    for (let uris of chunkedTemplateUris) {
      await deleteTemplatePreviews(uris);
    }

    res.end("Done");
  } catch (err) {
    res.status(500).send("Oops something went wrong: " + err);
    console.error(err);
  }
});

app.use(errorHandler);
