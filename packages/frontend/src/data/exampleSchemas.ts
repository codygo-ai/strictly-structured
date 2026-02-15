import type { ProviderId } from "@ssv/schemas/types";

export interface ExampleSchema {
  name: string;
  description: string;
  schema: string;
  /** Providers this schema is expected to work with. Empty = fails all. */
  compatibleWith: ProviderId[];
}

export const EXAMPLE_SCHEMAS: ExampleSchema[] = [
  // ── Works with all ──────────────────────────────────
  {
    name: "Simple object",
    description: "Minimal valid schema — works everywhere",
    compatibleWith: ["openai", "anthropic", "gemini"],
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
    name: "Enum field",
    description: "String enum — universally supported",
    compatibleWith: ["openai", "anthropic", "gemini"],
    schema: JSON.stringify(
      {
        type: "object",
        properties: {
          status: { type: "string", enum: ["active", "inactive", "pending"] },
          label: { type: "string" },
        },
        required: ["status", "label"],
        additionalProperties: false,
      },
      null,
      2,
    ),
  },
  {
    name: "anyOf union",
    description: "Discriminated union via anyOf",
    compatibleWith: ["openai", "anthropic", "gemini"],
    schema: JSON.stringify(
      {
        type: "object",
        properties: {
          result: {
            anyOf: [
              { type: "string" },
              {
                type: "object",
                properties: { code: { type: "integer" } },
                required: ["code"],
                additionalProperties: false,
              },
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
    description: "3 levels deep — within all limits",
    compatibleWith: ["openai", "anthropic", "gemini"],
    schema: JSON.stringify(
      {
        type: "object",
        properties: {
          user: {
            type: "object",
            properties: {
              profile: {
                type: "object",
                properties: {
                  bio: { type: "string" },
                  age: { type: "integer" },
                },
                required: ["bio", "age"],
                additionalProperties: false,
              },
            },
            required: ["profile"],
            additionalProperties: false,
          },
        },
        required: ["user"],
        additionalProperties: false,
      },
      null,
      2,
    ),
  },

  // ── Works with some ─────────────────────────────────
  {
    name: "Missing additionalProperties",
    description: "Required by OpenAI, optional for others",
    compatibleWith: ["anthropic", "gemini"],
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
  {
    name: "Optional fields",
    description: "OpenAI requires all fields in required",
    compatibleWith: ["anthropic", "gemini"],
    schema: JSON.stringify(
      {
        type: "object",
        properties: {
          name: { type: "string" },
          nickname: { type: "string" },
          email: { type: "string" },
        },
        required: ["name"],
        additionalProperties: false,
      },
      null,
      2,
    ),
  },
  {
    name: "String formats",
    description: "OpenAI supports most, Gemini some, Anthropic none",
    compatibleWith: ["openai"],
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
    name: "Pattern validation",
    description: "Only OpenAI supports regex patterns",
    compatibleWith: ["openai"],
    schema: JSON.stringify(
      {
        type: "object",
        properties: {
          zipCode: { type: "string", pattern: "^\\d{5}(-\\d{4})?$" },
          phone: { type: "string", pattern: "^\\+?[1-9]\\d{1,14}$" },
        },
        required: ["zipCode", "phone"],
        additionalProperties: false,
      },
      null,
      2,
    ),
  },
  {
    name: "Numeric constraints",
    description: "min/max supported by OpenAI & Gemini only",
    compatibleWith: ["openai", "gemini"],
    schema: JSON.stringify(
      {
        type: "object",
        properties: {
          score: { type: "number", minimum: 0, maximum: 100 },
          quantity: { type: "integer", minimum: 1 },
        },
        required: ["score", "quantity"],
        additionalProperties: false,
      },
      null,
      2,
    ),
  },
  {
    name: "Root array type",
    description: "Only Gemini allows root type to be array",
    compatibleWith: ["gemini"],
    schema: JSON.stringify(
      {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
          },
          required: ["id", "name"],
          additionalProperties: false,
        },
      },
      null,
      2,
    ),
  },

  // ── Fails all ───────────────────────────────────────
  {
    name: "oneOf union",
    description: "oneOf is not supported by any provider",
    compatibleWith: [],
    schema: JSON.stringify(
      {
        type: "object",
        properties: {
          result: {
            oneOf: [
              { type: "string" },
              { type: "integer" },
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
    name: "allOf composition",
    description: "allOf is unsupported — use flat objects instead",
    compatibleWith: [],
    schema: JSON.stringify(
      {
        type: "object",
        allOf: [
          {
            properties: { name: { type: "string" } },
            required: ["name"],
          },
          {
            properties: { age: { type: "integer" } },
            required: ["age"],
          },
        ],
        additionalProperties: false,
      },
      null,
      2,
    ),
  },
  {
    name: "Conditional (if/then/else)",
    description: "Not supported by any provider",
    compatibleWith: [],
    schema: JSON.stringify(
      {
        type: "object",
        properties: {
          type: { type: "string", enum: ["personal", "business"] },
          companyName: { type: "string" },
        },
        required: ["type"],
        if: { properties: { type: { const: "business" } } },
        then: { required: ["companyName"] },
        additionalProperties: false,
      },
      null,
      2,
    ),
  },
  {
    name: "Deep nesting (6 levels)",
    description: "Exceeds typical depth limits",
    compatibleWith: [],
    schema: JSON.stringify(
      {
        type: "object",
        properties: {
          a: {
            type: "object",
            properties: {
              b: {
                type: "object",
                properties: {
                  c: {
                    type: "object",
                    properties: {
                      d: {
                        type: "object",
                        properties: {
                          e: {
                            type: "object",
                            properties: {
                              f: { type: "string" },
                            },
                            required: ["f"],
                            additionalProperties: false,
                          },
                        },
                        required: ["e"],
                        additionalProperties: false,
                      },
                    },
                    required: ["d"],
                    additionalProperties: false,
                  },
                },
                required: ["c"],
                additionalProperties: false,
              },
            },
            required: ["b"],
            additionalProperties: false,
          },
        },
        required: ["a"],
        additionalProperties: false,
      },
      null,
      2,
    ),
  },
];
