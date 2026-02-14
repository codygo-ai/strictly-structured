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

export async function runFix(
  _body?: FixBody,
  _openaiApiKey?: string
): Promise<{ suggestedSchema: string } | { error: string }> {
  return { error: "Not implemented" };
}
