import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/');
});

test('has title', async ({ page }) => {
});

test('get started link', async ({ page }) => {
});
