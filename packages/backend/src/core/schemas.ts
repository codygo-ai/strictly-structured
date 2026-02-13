export function parseSchema(
  raw: string
): { ok: true; schema: object } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid JSON";
    return { ok: false, error: message };
  }
  if (parsed === null || typeof parsed !== "object") {
    return { ok: false, error: "Schema must be a JSON object" };
  }
  return { ok: true, schema: parsed as object };
}
