/**
 * Splits an array into chunks of a specified size.
 *
 * @template T
 * @param {T[]} dataArray - The array to be split into chunks.
 * @param {number} chunkSize - The size of each chunk.
 * @returns {T[][]} An array containing the chunks.
 */
export const chunkArray = (dataArray, chunkSize) => {
  const result = [];
  for (let i = 0; i < dataArray.length; i += chunkSize) {
    let chunk = dataArray.slice(i, i + chunkSize);
    result.push(chunk);
  }

  return result;
};

/**
 * @typedef {Object} Node
 * @property {string} type - The type of the node.
 * @property {string} value - The value of the node.
 */
/**
 * @typedef {Object} Triple
 * @property {Node} subject - The subject of the triple.
 * @property {Node} predicate - The predicate of the triple.
 * @property {Node} object - The object of the triple.
 */
/**
 * @typedef {Object} delta
 * @property {Triple[]} inserts - The triples to be inserted.
 * @property {Triple[]} deletes - The triples to be deleted.
 */
/**
 * Extracts unique subject URIs from the given deltas.
 *
 * @param {delta[]} deltas - The deltas to extract URIs from.
 * @returns {string[]} An array of unique URIs.
 */
export const extractInsertUris = (deltas) => {
  const uris = deltas
    .map(({ inserts }) => inserts.map(({ subject }) => subject.value))
    .flat();

  return [...new Set(uris)];
};
