export const updateOne = [
  {
    inserts: [],
    deletes: [
      {
        subject: {
          value: "http://data.lblod.info/templates/61B33386BF5C7500090006E7",
          type: "uri",
        },
        predicate: { value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#value", type: "uri" },
        object: {
          value:
            "${locatie} \n${B1}; \n${M10};\n${GVIII};\n${WM76.2}.\n${locatie2} \n${B9}.\n${locatie3} \n${B11}.",
          type: "literal",
        },
        graph: { value: "http://mu.semte.ch/graphs/mow/registry", type: "uri" },
      },
    ],
  },
  {
    inserts: [
      {
        subject: {
          value: "http://data.lblod.info/templates/61B33386BF5C7500090006E7",
          type: "uri",
        },
        predicate: { value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#value", type: "uri" },
        object: {
          value:
            "${locatie} \\n${B1}; \\n${M10};\\n${GVIII};\\n${WM76.2}.\\n${locatie2} \\n${B9}.\\n${locatie3} \\n${B11}.",
          type: "literal",
        },
        graph: { value: "http://mu.semte.ch/graphs/mow/registry", type: "uri" },
      },
    ],
    deletes: [],
  },
];

export const deleteOne = [
  {
    inserts: [],
    deletes: [
      {
        subject: {
          value: "http://data.lblod.info/templates/61B33386BF5C7500090006E7",
          type: "uri",
        },
        predicate: { value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#value", type: "uri" },
        object: {
          value:
            "${locatie} \n${B1}; \n${M10};\n${GVIII};\n${WM76.2}.\n${locatie2} \n${B9}.\n${locatie3} \n${B11}.",
          type: "literal",
        },
        graph: { value: "http://mu.semte.ch/graphs/mow/registry", type: "uri" },
      },
    ],
  },
];

export const multipleInsertWithDuplicateSubject = [
  {
    inserts: [
      {
        subject: { type: "uri", value: "http://mu.semte.ch/" },
        predicate: {
          type: "uri",
          value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        },
        object: { type: "uri", value: "https://schema.org/Project" },
      },
      {
        subject: {
          value: "http://data.lblod.info/templates/61B33386BF5C7500090006E7",
          type: "uri",
        },
        predicate: { value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#value", type: "uri" },
        object: {
          value:
            "${locatie} \n${B1}; \n${M10};\n${GVIII};\n${WM76.2}.\n${locatie2} \n${B9}.\n${locatie3} \n${B11}.",
          type: "literal",
        },
        graph: { value: "http://mu.semte.ch/graphs/mow/registry", type: "uri" },
      },
      {
        subject: {
          value: "http://data.lblod.info/templates/61B33386BF5C7500090006E7",
          type: "uri",
        },
        predicate: { value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#value", type: "uri" },
        object: {
          value:
            "${locatie} \n${B1}; \n${M10};\n${GVIII};\n${WM76.2}.\n${locatie2} \n${B9}.\n${locatie3} \n${B11}.",
          type: "literal",
        },
        graph: { value: "http://mu.semte.ch/graphs/mow/registry", type: "uri" },
      },
    ],
    deletes: [],
  },
  {
    inserts: [
      {
        subject: { type: "uri", value: "http://mu.semte.ch/" },
        predicate: { type: "uri", value: "http://purl.org/dc/terms/modified" },
        object: {
          type: "literal",
          value: "https://schema.org/Project",
          datatype: "http://www.w3.org/2001/XMLSchema#dateTime",
        },
      },
    ],
    deletes: [],
  },
];
