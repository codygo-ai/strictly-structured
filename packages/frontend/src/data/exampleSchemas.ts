export interface ExampleSchema {
  name: string;
  description: string;
  schema: string;
}

export const EXAMPLE_SCHEMAS: ExampleSchema[] = [
  {
    name: "Simple object",
    description: "Works with all providers",
    schema: JSON.stringify(
      {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "integer" },
        },
        required: ["name", "age"],
        additionalProperties: false,
      },
      null,
      2,
    ),
  },
  {
    name: "oneOf union",
    description: "Fails on some providers",
    schema: JSON.stringify(
      {
        type: "object",
        properties: {
          result: {
            oneOf: [
              { type: "string" },
              { type: "object", properties: { code: { type: "integer" } }, required: ["code"], additionalProperties: false },
            ],
          },
        },
        required: ["result"],
        additionalProperties: false,
      },
      null,
      2,
    ),
  },
  {
    name: "Nested objects",
    description: "May hit depth limits",
    schema: JSON.stringify(
      {
        type: "object",
        properties: {
          level1: {
            type: "object",
            properties: {
              level2: {
                type: "object",
                properties: {
                  level3: {
                    type: "object",
                    properties: {
                      level4: {
                        type: "object",
                        properties: {
                          value: { type: "string" },
                        },
                        required: ["value"],
                        additionalProperties: false,
                      },
                    },
                    required: ["level4"],
                    additionalProperties: false,
                  },
                },
                required: ["level3"],
                additionalProperties: false,
              },
            },
            required: ["level2"],
            additionalProperties: false,
          },
        },
        required: ["level1"],
        additionalProperties: false,
      },
      null,
      2,
    ),
  },
  {
    name: "String formats",
    description: "Format support varies by provider",
    schema: JSON.stringify(
      {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          created: { type: "string", format: "date-time" },
          website: { type: "string", format: "uri" },
          ip: { type: "string", format: "ipv4" },
        },
        required: ["email", "created", "website", "ip"],
        additionalProperties: false,
      },
      null,
      2,
    ),
  },
  {
    name: "Missing additionalProperties",
    description: "Required by some providers, optional for others",
    schema: JSON.stringify(
      {
        type: "object",
        properties: {
          name: { type: "string" },
          tags: {
            type: "array",
            items: {
              type: "object",
              properties: {
                key: { type: "string" },
                value: { type: "string" },
              },
              required: ["key", "value"],
            },
          },
        },
        required: ["name"],
      },
      null,
      2,
    ),
  },
];
