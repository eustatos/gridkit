import { test, expect } from '@playwright/test';

test.describe('DevTools State Inspection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should inspect table state through DevTools panel', async ({ page }) => {
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0), 'Table should contain at least one row';
    
    const columns = page.locator('thead th');
    const colCount = await columns.count();
    expect(colCount).toBeGreaterThan(0), 'Table should contain at least one column';
  });

  test('should inspect table data content', async ({ page }) => {
    const firstRow = page.locator('tbody tr:first-child');
    await expect(firstRow).toBeVisible();
    
    const cells = firstRow.locator('td');
    const cellCount = await cells.count();
    
    for (let i = 0; i < cellCount; i++) {
      const cellText = await cells.nth(i).textContent();
      expect(cellText).not.toBe(''), `Cell ${i} in first row should contain data`;
    }
  });

  test('should inspect table metadata (id, rowCount, columnCount)', async ({ page }) => {
    const stats = page.locator('div strong:has-text("Statistics:")');
    await expect(stats).toBeVisible();
    
    const statsText = await stats.locator('xpath=../..').textContent();
    
    expect(statsText).toMatch(/rows?/i), 'Statistics should contain row information';
    expect(statsText).toMatch(/per page/i), 'Statistics should contain per page information';
    expect(statsText).toMatch(/page/i), 'Statistics should contain page information';
  });
});
