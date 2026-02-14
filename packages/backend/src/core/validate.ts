export type ValidateBody = {
  schema?: string;
  providers?: string[];
  modelIds?: string[];
};

export async function runValidate(
  _body?: ValidateBody,
  _apiKeys?: Record<string, string | undefined>
): Promise<
  | { results: Array<{ provider: string; model: string; ok: boolean; latencyMs: number; error?: string }> }
  | { error: string }
> {
  return { error: "Not implemented" };
}
