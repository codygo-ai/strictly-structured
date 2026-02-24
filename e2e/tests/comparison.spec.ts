import fs from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { E2E_SCHEMA, E2E_SCHEMA_ID, schemaToBase64 } from '../fixtures/schema';
import { getServerValidationResults } from '../serverBaseline';
import { assertUrlSchemaApplied } from '../urlSchema';

test.describe('Server vs UI comparison', () => {
  test('UI validation results match server validation baseline', async ({ page }) => {
    const schema = E2E_SCHEMA;
    const base64 = schemaToBase64(schema);
    await page.goto(`/?schema=${base64}`);

    await expect(page.getByTestId('compatibility-dashboard')).toBeVisible({
      timeout: 15_000,
    });
    await assertUrlSchemaApplied(page, schema, { timeout: 10_000 });
    const serverResults = getServerValidationResults(schema);
    // Wait for URL schema to be applied and validation to settle (debounce ~200ms)
    const gpt4o1 = serverResults.find((r) => r.ruleSetId === 'gpt-4-o1');
    if (gpt4o1) {
      const card = page.getByTestId('rule-set-card-gpt-4-o1');
      await expect(card.locator('[data-testid="rule-set-error-count"]')).toHaveAttribute(
        'data-error-count',
        String(gpt4o1.errorCount),
        {
          timeout: 10_000,
        },
      );
    }

    const results: Array<{
      schemaId: string;
      ruleSetId: string;
      serverValid: boolean;
      serverErrorCount: number;
      uiValid: boolean;
      uiErrorCount: number;
      match: boolean;
    }> = [];

    for (const server of serverResults) {
      const card = page.getByTestId(`rule-set-card-${server.ruleSetId}`);
      await expect(card).toBeVisible({ timeout: 5_000 });

      const errorCountEl = card.locator('[data-testid="rule-set-error-count"]');
      const uiErrorCountStr = await errorCountEl.getAttribute('data-error-count');
      const uiErrorCount = uiErrorCountStr !== null ? parseInt(uiErrorCountStr, 10) || 0 : 0;
      const uiValid = (await card.getAttribute('data-valid')) === 'true';

      const match = server.valid === uiValid && server.errorCount === uiErrorCount;
      results.push({
        schemaId: E2E_SCHEMA_ID,
        ruleSetId: server.ruleSetId,
        serverValid: server.valid,
        serverErrorCount: server.errorCount,
        uiValid,
        uiErrorCount,
        match,
      });
    }

    const mismatches = results.filter((r) => !r.match);
    const resultsDir = path.join(process.cwd(), 'e2e', 'results');
    fs.mkdirSync(resultsDir, { recursive: true });
    const reportPath = path.join(resultsDir, `comparison-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

    expect(
      mismatches,
      `Server vs UI mismatch. Report: ${reportPath}. Mismatches: ${JSON.stringify(mismatches)}`,
    ).toHaveLength(0);
  });
});
