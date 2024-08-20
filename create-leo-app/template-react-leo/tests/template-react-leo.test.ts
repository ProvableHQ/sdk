import { test, expect } from '@playwright/test';

test('count', async ({ page }) => {
  await page.goto('/');

  const button = page.getByRole('button', { name: 'count is' });
  await button.click();
  
  expect(await button.textContent()).toBe('count is 1')

  await button.click();
  expect(await button.textContent()).toBe('count is 2')
});

test('generate account', async ({ page }) => {
  await page.goto('/');

  // looks like we need to wait a little for react to setup
  await page.waitForTimeout(1000);

  const accountButton = page.getByRole('button', { name: 'Click to generate account' });
  await accountButton.click(); 

  const accountButtonNew = page.getByRole('button', { name: 'Account private key is' });
  expect(await accountButtonNew.textContent()).toContain('Account private key is');
  expect(await accountButtonNew.textContent()).toHaveLength(84);
});

test('local program execution', async ({ page }) => {
  test.setTimeout(90000);

  await page.goto('/');

  // looks like we need to wait a little for react to setup
  await page.waitForTimeout(1000);

  const executeButton = page.getByRole('button', { name: 'Execute helloworld.aleo' });
  await executeButton.click();

  const result = page.getByTestId('result');
  
  // wait for program to execute locally
  for (let i = 1; i <= 60; i++) {
    await page.waitForTimeout(1000);
  }

  expect(await result.textContent()).toContain('["10u32"]')
});

