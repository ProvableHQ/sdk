// @ts-check
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5173/');
  page.on('dialog', dialog => dialog.accept());
});

test('builds', async ({ page }) => {
    const accountButton = await page.getByTestId("generate-account-button");
    await expect(accountButton).toHaveText("Click to generate account");
    await page.waitForTimeout(1000);
    await accountButton.click();
    await expect(accountButton).toContainText('APrivateKey1');

    const executeButton = await page.getByTestId("execute-button");
    await expect(executeButton).toHaveText("Execute hello_hello.aleo");
    await page.waitForTimeout(1000);
    await executeButton.click();
    let msg = await page.waitForEvent('console');
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
    let alertMsg = await page.waitForEvent('dialog');
    await expect(alertMsg.message()).toContain("10u32");
});
