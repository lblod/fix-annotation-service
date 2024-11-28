if (!process.env.SPARQL_ENDPOINT)
    throw `Expected 'SPARQL_ENDPOINT' to be provided.`;

export const SPARQL_ENDPOINT = process.env.SPARQL_ENDPOINT;