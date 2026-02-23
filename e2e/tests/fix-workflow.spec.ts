import { expect, test } from '@playwright/test';

import { getServerFixedSchema } from '../serverBaseline';
import { assertUrlSchemaApplied } from '../urlSchema';

const INVALID_SCHEMA = `{
  "type": "object",
  "properties": {
    "name": { "type": "string" }
  }
}`;

function schemaToBase64(schema: string): string {
  return Buffer.from(schema, 'utf-8').toString('base64');
}

function normalizeJson(s: string): string {
  return JSON.stringify(JSON.parse(s), null, 2);
}

test.describe('Fix workflow', () => {
  test('Fix all updates editor to match canonical fixed schema for rule set', async ({ page }) => {
    const base64 = schemaToBase64(INVALID_SCHEMA);
    await page.goto(`/?schema=${base64}`);

    await expect(page.getByTestId('compatibility-dashboard')).toBeVisible({
      timeout: 15_000,
    });
    await assertUrlSchemaApplied(page, INVALID_SCHEMA, { timeout: 10_000 });
    const card = page.getByTestId('rule-set-card-gpt-4-o1');
    await expect(card.locator('[data-testid="rule-set-error-count"]')).toHaveAttribute(
      'data-error-count',
      /[1-9]\d*/,
      { timeout: 10_000 },
    );
    await card.click();
    await expect(page.getByTestId('issues-tab')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId('fix-all-button')).toBeVisible();
    await page.getByTestId('fix-all-button').click();

    await expect(page.locator('[data-testid="issues-tab"][data-fix-applied="true"]')).toBeVisible({
      timeout: 15_000,
    });
    const schemaInput = page.getByTestId('schema-content');
    await expect(schemaInput).toHaveValue(/additionalProperties/, { timeout: 10_000 });
    const uiSchema = await schemaInput.inputValue();
    const expectedSchema = getServerFixedSchema(INVALID_SCHEMA, 'gpt-4-o1');
    expect(normalizeJson(uiSchema)).toBe(normalizeJson(expectedSchema));
  });
});
