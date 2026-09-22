// Against Chrome's real WebMCP (Chromium launched with --enable-features=WebMCP), not the fake the other scenario uses.
// Chrome exposes the API on document.modelContext. Whether a page can call its own tools is up to Chrome; the agent side is
// Chrome's. What this proves: the descriptors Sepiola derives from the grammar are accepted by the real registerTool.
import { test, expect } from '@playwright/test';

test('Chromium with WebMCP enabled accepts all eight moves through document.modelContext', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.waitForFunction(() => window.sepiola?.ready === true);
  const info = await page.evaluate(async () => ({
    onDocument: typeof document.modelContext,
    onNavigator: typeof navigator.modelContext,
    hasRegisterTool: typeof document.modelContext?.registerTool,
    registered: await window.sepiola.webmcp,
  }));
  expect(info.onDocument, 'Chrome puts WebMCP on document').toBe('object');
  expect(info.hasRegisterTool).toBe('function');
  expect(info.registered).toEqual({ available: true, registered: 8 });
  await expect(page.locator('#pill-webmcp')).toHaveText(/WebMCP · 8 tools/);
  await page.click('.signal summary');
  await expect(page.locator('#signal-panel')).toContainText('8 tools registered');
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'test/shots/webmcp-real-chrome.png' });
});
