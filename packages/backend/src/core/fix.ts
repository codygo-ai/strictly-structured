import OpenAI from "openai";
import { parseSchema } from "./schemas.js";

export type FixIssue = {
  path: string;
  keyword: string;
  message: string;
  suggestion?: string;
};

export type FixSchemaValidityError = { path: string; message: string };

export type FixBody = {
  schema: string;
  modelIds?: string[];
  issues: FixIssue[];
  schemaValidityErrors?: FixSchemaValidityError[];
};

const FIX_MODEL = "gpt-4.1-mini";

function buildFixPrompt(body: FixBody): string {
  const parts: string[] = [
    "You are a JSON Schema expert. Fix the following JSON Schema so it is valid and compatible with the target model(s).",
    "",
    "Current schema (JSON):",
    "```json",
    body.schema,
    "```",
  ];

  if (body.schemaValidityErrors && body.schemaValidityErrors.length > 0) {
    parts.push("", "Schema validity errors (fix these first):");
    for (const e of body.schemaValidityErrors) {
      parts.push(`- ${e.path ? e.path + ": " : ""}${e.message}`);
    }
  }

  if (body.issues.length > 0) {
    parts.push("", "Compatibility issues for the selected model(s):");
    for (const i of body.issues) {
      parts.push(
        `- ${i.path ? i.path + ": " : ""}[${i.keyword}] ${i.message}` +
          (i.suggestion ? ` (suggestion: ${i.suggestion})` : "")
      );
    }
  }

  if (body.modelIds && body.modelIds.length > 0) {
    parts.push(
      "",
      "Target model(s): " + body.modelIds.join(", "),
      "Use only keywords and patterns supported by these models."
    );
  }

  parts.push(
    "",
    "Respond with ONLY the fixed JSON Schema as a single JSON object. No markdown, no explanation, no code fence."
  );
  return parts.join("\n");
}

export async function runFix(
  body: FixBody,
  openaiApiKey?: string
): Promise<{ suggestedSchema: string } | { error: string }> {
  const apiKey = openaiApiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { error: "OPENAI_API_KEY not configured" };
  }

  const trimmed = (body.schema || "").trim();
  if (!trimmed) {
    return { error: "Missing or invalid 'schema' (string)" };
  }

  const parsed = parseSchema(trimmed);
  if (!parsed.ok) {
    return { error: `Invalid schema JSON: ${parsed.error}` };
  }

  const prompt = buildFixPrompt(body);
  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model: FIX_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const content =
      completion.choices[0]?.message?.content?.trim().replace(/^```json\s*|\s*```$/g, "").trim() ??
      "";
    if (!content) {
      return { error: "Model returned empty response" };
    }

    try {
      const obj = JSON.parse(content);
      const suggestedSchema = JSON.stringify(obj, null, 2);
      return { suggestedSchema };
    } catch {
      return { error: "Model response was not valid JSON" };
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: message };
  }
}
