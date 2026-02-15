import type { SdkId, SdkInfo, SdkTransformResult } from "../types";
import { simulateAnthropicSdk } from "./transforms/anthropic-sdk";
import { simulateGeminiSdk } from "./transforms/gemini-sdk";
import { simulateInstructor } from "./transforms/instructor";
import { simulateLangchainJs } from "./transforms/langchain-js";
import { simulateLangchainPy } from "./transforms/langchain-py";
import { simulateOpenAiSdk } from "./transforms/openai-sdk";
import { simulateVercelAi } from "./transforms/vercel-ai";

type TransformFn = (schema: Record<string, unknown>) => SdkTransformResult;

const TRANSFORM_MAP: Record<SdkId, TransformFn> = {
  "openai-sdk": simulateOpenAiSdk,
  "anthropic-sdk": simulateAnthropicSdk,
  "gemini-sdk": simulateGeminiSdk,
  "vercel-ai": simulateVercelAi,
  "langchain-py": simulateLangchainPy,
  "langchain-js": simulateLangchainJs,
  instructor: simulateInstructor,
};

const SDK_INFO: SdkInfo[] = [
  {
    id: "openai-sdk",
    name: "OpenAI Python/TS SDK",
    language: "both",
    providers: ["openai"],
    description:
      "Official OpenAI SDK. Uses zodResponseFormat() (TS) or to_strict_json_schema() (Python). Adds additionalProperties: false, forces all-required, makes optionals nullable, unwraps single allOf, dereferences $ref with siblings.",
  },
  {
    id: "anthropic-sdk",
    name: "Anthropic Python/TS SDK",
    language: "both",
    providers: ["anthropic"],
    description:
      "Official Anthropic SDK. Uses transform_schema(). Strips unsupported keywords (pattern, format, min/max, etc.) into description, adds additionalProperties: false, rewrites oneOf → anyOf, filters formats.",
  },
  {
    id: "gemini-sdk",
    name: "Google GenAI SDK",
    language: "both",
    providers: ["gemini"],
    description:
      "Official Google GenAI SDK. Inlines $ref/$defs, converts null → nullable, converts const → enum, injects propertyOrdering.",
  },
  {
    id: "vercel-ai",
    name: "Vercel AI SDK",
    language: "typescript",
    providers: ["openai", "anthropic", "gemini"],
    description:
      "Vercel AI SDK. For OpenAI (strictJsonSchema: true): additionalProperties: false + all-required. For Gemini: converts to OpenAPI 3.0. For Anthropic: pass-through (NO transforms).",
  },
  {
    id: "langchain-py",
    name: "LangChain Python",
    language: "python",
    providers: ["openai", "anthropic", "gemini"],
    description:
      "LangChain Python. Dereferences $ref. For OpenAI strict: adds additionalProperties: false at TOP-LEVEL ONLY (known bug: misses nested objects). Does NOT call Anthropic transform_schema().",
  },
  {
    id: "langchain-js",
    name: "LangChain.js",
    language: "typescript",
    providers: ["openai", "anthropic", "gemini"],
    description:
      "LangChain.js. Uses standard zod-to-json-schema (not OpenAI's fork). Top-level-only additionalProperties: false. Same nested gap as LangChain Python.",
  },
  {
    id: "instructor",
    name: "Instructor Python",
    language: "python",
    providers: ["openai", "anthropic"],
    description:
      "Instructor Python. Uses own openai_schema(), NOT to_strict_json_schema. No strict-mode transforms — relies entirely on retry/reask to handle API errors.",
  },
];

export function simulateSdkTransform(
  schema: Record<string, unknown>,
  sdk: SdkId,
): SdkTransformResult {
  const transformFn = TRANSFORM_MAP[sdk];
  return transformFn(schema);
}

export function listSdks(): SdkInfo[] {
  return SDK_INFO;
}
