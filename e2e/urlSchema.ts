import type { Page } from '@playwright/test';

const E2E_REQUIRED_MSG =
  'URL schema was not applied (editor shows default schema). Start the frontend with NEXT_PUBLIC_E2E=true (e.g. NEXT_PUBLIC_E2E=true pnpm run dev:frontend).';

function isDefaultSchema(parsed: unknown): boolean {
  if (typeof parsed !== 'object' || parsed === null) return false;
  const p = parsed as Record<string, unknown>;
  const props = p.properties as Record<string, unknown> | undefined;
  return Boolean(
    props?.category && typeof (props.category as Record<string, unknown>)?.oneOf === 'object',
  );
}

/**
 * Asserts that the editor content matches the expected schema (from ?schema=).
 * If the editor still has the default schema (category + oneOf), throws with a message
 * to start the frontend with NEXT_PUBLIC_E2E=true.
 */
export async function assertUrlSchemaApplied(
  page: Page,
  expectedSchemaJson: string,
  options?: { timeout?: number },
): Promise<void> {
  const timeout = options?.timeout ?? 10_000;
  const schemaInput = page.getByTestId('schema-content');
  await schemaInput.waitFor({ state: 'attached', timeout });
  const value = await schemaInput.inputValue();
  let received: unknown;
  try {
    received = JSON.parse(value);
  } catch {
    throw new Error(`Editor content is not valid JSON. ${E2E_REQUIRED_MSG}`);
  }
  const expected = JSON.parse(expectedSchemaJson) as unknown;
  const norm = (x: unknown) => JSON.stringify(x);
  if (norm(received) === norm(expected)) return;
  if (isDefaultSchema(received)) {
    throw new Error(E2E_REQUIRED_MSG);
  }
  throw new Error(
    `Editor schema does not match expected. Expected (normalized): ${norm(expected).slice(0, 300)}... Got: ${norm(received).slice(0, 300)}...`,
  );
}
