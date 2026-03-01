import { expect, test } from '@playwright/test';

import { E2E_SCHEMA, schemaToBase64 } from '../fixtures/schema';
import { getServerFixedSchema } from '../serverBaseline';
import { assertUrlSchemaApplied } from '../urlSchema';

function normalizeJson(s: string): string {
  return JSON.stringify(JSON.parse(s), null, 2);
}

test.describe('Fix workflow', () => {
  test('Fix all updates editor to match canonical fixed schema for rule set', async ({ page }) => {
    const base64 = schemaToBase64(E2E_SCHEMA);
    await page.goto(`/?schema=${base64}`);

    await expect(page.getByTestId('compatibility-dashboard')).toBeVisible({
      timeout: 15_000,
    });
    await assertUrlSchemaApplied(page, E2E_SCHEMA, { timeout: 10_000 });
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
    const expectedSchema = getServerFixedSchema(E2E_SCHEMA, 'gpt-4-o1');
    expect(normalizeJson(uiSchema)).toBe(normalizeJson(expectedSchema));
  });
});
