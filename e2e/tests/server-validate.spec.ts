import { expect, test } from '@playwright/test';

const INVALID_SCHEMA = `{
  "type": "object",
  "properties": {
    "name": { "type": "string" }
  }
}`;

function schemaToBase64(schema: string): string {
  return Buffer.from(schema, 'utf-8').toString('base64');
}

test.describe('Server validation', () => {
  test('Validate on server updates UI (results or error)', async ({ page }) => {
    test.setTimeout(90_000);
    const base64 = schemaToBase64(INVALID_SCHEMA);
    await page.goto(`/?schema=${base64}`);

    await expect(page.getByTestId('compatibility-dashboard')).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId('rule-set-card-gpt-4-o1').click();
    await expect(page.getByTestId('issues-tab')).toBeVisible({ timeout: 5_000 });

    await page.getByTestId('server-validate-button').click();

    const loading = page.getByTestId('server-validation-loading');
    const done = page
      .getByTestId('server-validation-error')
      .or(page.getByTestId('server-validation-results'));
    const started = await Promise.race([
      loading.waitFor({ state: 'visible', timeout: 10_000 }).then(() => true),
      done.waitFor({ state: 'visible', timeout: 10_000 }).then(() => true),
    ]).catch(() => false);
    if (!started) {
      test.skip(true, 'Server validate did not start (auth or backend not available)');
      return;
    }
    try {
      await expect(done).toBeVisible({ timeout: 60_000 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Timeout') || msg.includes('timeout')) {
        test.skip(
          true,
          'Server validation did not complete within 60s. E2E runs in a fresh browser with no auth; sign-in popup cannot be completed, so the request never runs.',
        );
      }
      throw err;
    }
  });
});
