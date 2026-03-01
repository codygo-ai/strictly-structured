import { expect, test } from '@playwright/test';

import { E2E_SCHEMA } from '../fixtures/schema';

test.describe('Validation UI', () => {
  test('shows validation results and allows selecting a rule set', async ({ page }) => {
    await page.goto('/');

    const editor = page.getByTestId('schema-editor');
    await editor.click();
    await page.keyboard.press('Meta+a');
    await page.keyboard.insertText(E2E_SCHEMA);

    await expect(page.getByTestId('compatibility-dashboard')).toBeVisible({ timeout: 15_000 });
    const firstCard = page.getByTestId('rule-set-card-gpt-4-o1');
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    await expect(page.getByTestId('issues-tab')).toBeVisible();
    const cardStatus = firstCard.locator('.status-card-status');
    await expect(cardStatus).toContainText(/issue|issues/, { timeout: 5_000 });
  });
});
