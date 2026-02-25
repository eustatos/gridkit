import { test, expect } from '@playwright/test';

test.describe('UI Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display page title', async ({ page }) => {
    await expect(page).toHaveTitle(/GridKit DevTools Demo/);
  });

  test('should have header with title', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('GridKit DevTools Demo');
  });

  test('should have Dark/Light mode button', async ({ page }) => {
    const darkModeButton = page.locator('button:has-text("Light Mode")');
    await expect(darkModeButton).toBeVisible();
    await expect(darkModeButton).toHaveAttribute('type', 'button');
  });

  test('should have notifications toggle button', async ({ page }) => {
    const notificationsButton = page.locator('button:has-text("Notifications: ON")');
    await expect(notificationsButton).toBeVisible();
  });

  test('should have statistics footer', async ({ page }) => {
    const stats = page.locator('div strong:has-text("Statistics:")');
    await expect(stats).toBeVisible();
    await expect(stats).toContainText('rows');
    await expect(stats).toContainText('per page');
  });

  test('should display status badges with colors', async ({ page }) => {
    const statusCells = page.locator('tbody td:nth-child(4) span');
    await expect(statusCells).toHaveCount(10);
    
    // Check for active status color (green)
    const activeStatus = statusCells.filter({ has: page.locator('text="active"') });
    await expect(activeStatus.first()).toBeVisible();
  });

  test('should format salary as currency', async ({ page }) => {
    const salaryCell = page.locator('tbody td:nth-child(5)');
    const salaryText = await salaryCell.nth(0).textContent();
    
    // Should contain dollar sign and be a reasonable salary
    expect(salaryText).toContain('$');
    expect(salaryText).toContain('.00');
  });

  test('should display join dates', async ({ page }) => {
    const dateCell = page.locator('tbody td:nth-child(6)');
    const dateText = await dateCell.nth(0).textContent();
    
    // Should be a date format
    expect(dateText).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  test('should have responsive table layout', async ({ page }) => {
    const table = page.locator('table');
    await expect(table).toHaveCSS('width', '100%');
    await expect(table).toHaveCSS('border-collapse', 'collapse');
  });

  test('should show sorting indicators on headers', async ({ page }) => {
    const headers = page.locator('thead th');
    
    // First header should have sort indicator
    const firstHeader = headers.nth(0);
    await expect(firstHeader).toContainText('Name');
    await expect(firstHeader).toContainText('↕'); // No sort yet
  });
});
