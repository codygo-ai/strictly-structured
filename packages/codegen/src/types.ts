import type { ProviderId } from "@ssv/schemas/types";

export type InputFormat = "json-schema" | "zod" | "pydantic";

export type { ProviderId };

export const SDK_IDS = [
  "openai-sdk",
  "anthropic-sdk",
  "gemini-sdk",
  "vercel-ai",
  "langchain-py",
  "langchain-js",
  "instructor",
] as const;

export type SdkId = (typeof SDK_IDS)[number];

export interface ConversionResult {
  schema: Record<string, unknown>;
  warnings: ConversionWarning[];
  unsupported: string[];
}

export interface ConversionWarning {
  message: string;
  severity: "warning" | "info";
  line?: number;
}

export interface SdkTransformResult {
  sdk: SdkId;
  original: Record<string, unknown>;
  transformed: Record<string, unknown>;
  changes: SdkChange[];
  gaps: SdkGap[];
}

export interface SdkChange {
  path: string;
  kind: "added" | "removed" | "modified";
  description: string;
  before?: unknown;
  after?: unknown;
}

export interface SdkGap {
  rule: string;
  description: string;
  willCauseError: boolean;
}

export interface SdkInfo {
  id: SdkId;
  name: string;
  language: "typescript" | "python" | "both";
  providers: ProviderId[];
  description: string;
}

export interface FixCodeResult {
  fixedCode: string;
  fixedSchema: Record<string, unknown>;
  appliedFixes: string[];
  remainingIssues: string[];
}
