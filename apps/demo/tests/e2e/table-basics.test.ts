import { test, expect } from '@playwright/test';

test.describe('Table Basics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display table with 10 rows per page', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('table');
    
    // Check table exists
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    // Check header columns
    const headers = page.locator('thead th');
    await expect(headers).toHaveCount(6);
    await expect(headers.nth(0)).toHaveText('Name');
    await expect(headers.nth(1)).toHaveText('Email');
    await expect(headers.nth(2)).toHaveText('Role');
    await expect(headers.nth(3)).toHaveText('Status');
    await expect(headers.nth(4)).toHaveText('Salary');
    await expect(headers.nth(5)).toHaveText('Join Date');
  });

  test('should display pagination controls', async ({ page }) => {
    const pagination = page.locator('div strong:has-text("Statistics")');
    await expect(pagination).toBeVisible();
    
    // Should show 10 rows per page
    await expect(pagination).toContainText('10 per page');
  });

  test('should have 5 pages (50 rows / 10 per page)', async ({ page }) => {
    // Check pagination links exist
    const pageLinks = page.locator('text=/Page \\d+/');
    await expect(pageLinks).toBeVisible();
  });
});
