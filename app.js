import { app, errorHandler } from "mu";
import bodyParser from "body-parser";
import {
  deleteAnnotated,
  getAllAnnotatedTemplateUris,
  getTemplatesAndVariables,
  updateAnnotated,
  getLinkedTemplates,
} from "./lib/queries.js";
import {
  generateAnnotatedTemplates,
  parseSelectTemplateBindings,
} from "./lib/process-template-annotation.js";
import { chunkArray, extractInsertUris } from "./lib/utils.js";

/**
 * Processes the template annotations.
 *
 * @param {SparqlSelectTemplatesBinding[]} bindings - The bindings from the SPARQL response.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
const processTemplateAnnotations = async (bindings) => {
  const templates = parseSelectTemplateBindings(bindings);
  const annotatedTemplates = generateAnnotatedTemplates(templates);
  const chunks = chunkArray(annotatedTemplates, 10);
  for (let chunk of chunks) {
    await updateAnnotated(chunk);
  }
};

const updateLinkedTemplates = async (uris) => {
  const urisToUpdate = await getLinkedTemplates(uris);
  if (!urisToUpdate.length) {
    //No templates linked to the updated ones
    return;
  }
  const templates = await getTemplatesAndVariables(urisToUpdate);
  processTemplateAnnotations(templates.results.bindings);
};

// updates annotated templates based on insertions in the delta
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
  processTemplateAnnotations(templates.results.bindings).then(() => {
    updateLinkedTemplates(updatedUris);
  });

  return res.status(202).send();
});

// Fetches and updates all annotated templates
app.post("/update-all", async (_req, res) => {
  try {
    const response = await getTemplatesAndVariables();
    if (!response.results.bindings.length) {
      return res.status(404).send("No templates found");
    }

    await processTemplateAnnotations(response.results.bindings);
    res.end("Done");
  } catch (err) {
    res.status(500).send("Oops something went wrong: " + err);
    console.log(err);
  }
});

// Clear all annotated templates
app.post("/clear", async (_req, res) => {
  try {
    const templateUris = await getAllAnnotatedTemplateUris();
    const chunkedTemplateUris = chunkArray(templateUris, 10);

    for (let uris of chunkedTemplateUris) {
      await deleteAnnotated(uris);
    }

    res.end("Done");
  } catch (err) {
    res.status(500).send("Oops something went wrong: " + err);
    console.error(err);
  }
});

app.use(errorHandler);
