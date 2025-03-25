// @ts-check
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5173/');
  page.on('dialog', dialog => dialog.accept());
});

test('builds', async ({ page }) => {
    const accountButton = await page.getByTestId("key-button");
    await expect(accountButton).toHaveText("Get Private Key");
    await page.waitForTimeout(1000);
    await accountButton.click();
    let msg = await page.waitForEvent('console');
    await expect(msg.text()).toContain("APrivateKey1");

    const executeButton = await page.getByTestId("execute-button");
    await expect(executeButton).toHaveText("Call Execute Function");
    await page.waitForTimeout(1000);
    await executeButton.click();
    msg = await page.waitForEvent('console');
    await expect(msg.text()).toBe("Function keys not found. Key finder response: 'Error: Invalid parameters provided, must provide either a cacheKey and/or a proverUrl and a verifierUrl'. The function keys will be synthesized");
    msg = await page.waitForEvent('console');
    await expect(msg.text()).toBe("Running program offline");
    msg = await page.waitForEvent('console');
    await expect(msg.text()).toBe("Proving key:  undefined");
    msg = await page.waitForEvent('console');
    await expect(msg.text()).toBe("Verifying key:  undefined");
    msg = await page.waitForEvent('console');
    await expect(msg.text()).toBe("Executing local function: hello");
    msg = await page.waitForEvent('console');
    await expect(msg.text()).toBe("Check program imports are valid and add them to the process");
    msg = await page.waitForEvent('console');
    await expect(msg.text()).toBe("Loading program");
    msg = await page.waitForEvent('console');
    await expect(msg.text()).toBe("Loading function");
    msg = await page.waitForEvent('console');
    await expect(msg.text()).toBe("Adding program to the process");
    msg = await page.waitForEvent('console');
    await expect(msg.text()).toBe("Creating authorization");
    msg = await page.waitForEvent('console');
    await expect(msg.text()).toBe("parsing inputs");
    msg = await page.waitForEvent('console');
    await expect(msg.text()).toBe("Executing program");
    let alert = await page.waitForEvent('dialog');
    await expect(alert.message()).toContain("10u32");
});
