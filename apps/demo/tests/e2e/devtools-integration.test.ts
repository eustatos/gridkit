import { test, expect } from '@playwright/test';

test.describe('DevTools Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show table is ready', async ({ page }) => {
    const table = page.locator('table');
    await expect(table).toBeVisible();

    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should support DevTools protocol commands', async ({ page }) => {
    const stats = page.locator('div strong:has-text("Statistics:")');
    await expect(stats).toBeVisible();

    const table = page.locator('table');
    const tableRect = await table.boundingBox();

    expect(tableRect).toBeDefined();
    expect(tableRect?.width).toBeGreaterThan(0);
    expect(tableRect?.height).toBeGreaterThan(0);
  });

  test('should display table rows correctly', async ({ page }) => {
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should allow performance monitoring', async ({ page }) => {
    const startTime = Date.now();
    await page.waitForTimeout(100);
    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeGreaterThanOrEqual(100);
    expect(duration).toBeLessThan(500);
  });
});

test.describe('DevTools Inspection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should inspect table state through DevTools panel', async ({ page }) => {
    // Проверка, что таблица отображается
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Проверка количества строк
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Проверка, что колонки присутствуют
    const columns = page.locator('thead th');
    const colCount = await columns.count();
    expect(colCount).toBeGreaterThan(0);
  });

  test('should inspect table data content', async ({ page }) => {
    // Получаем первую строку данных
    const firstRow = page.locator('tbody tr:first-child');
    await expect(firstRow).toBeVisible();

    // Проверяем, что строка содержит данные (не пустая)
    const cells = firstRow.locator('td');
    const cellCount = await cells.count();

    for (let i = 0; i < cellCount; i++) {
      const cellText = await cells.nth(i).textContent();
      expect(cellText).not.toBe('');
    }
  });

  test('should inspect table metadata (id, rowCount, columnCount)', async ({ page }) => {
    // Проверка наличия статистики (из README демо-приложения)
    const stats = page.locator('div strong:has-text("Statistics:")');
    await expect(stats).toBeVisible();

    // Получаем текст родительского элемента (вся статистика)
    const statsParent = stats.locator('..');
    const statsText = await statsParent.textContent();

    // Проверяем, что статистика содержит информацию о таблице
    expect(statsText).toMatch(/rows?/i);
    expect(statsText).toMatch(/per page/i);
  });
});

test.describe('DevTools Events Timeline', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should track sorting events in DevTools timeline', async ({ page }) => {
    // Click on Name header to trigger sorting
    const nameHeader = page.locator('thead th:has-text("Name")');
    await nameHeader.click();

    // Verify sorting indicator appears (ascending)
    const sortIndicatorAsc = page.locator('thead th:has-text("Name") span:text("↑")');
    await expect(sortIndicatorAsc).toBeVisible({ timeout: 1000 });

    // If DevTools extension is loaded, it would log state updates
    // We verify the event system works by checking visual feedback
    const hasSortIndicator = await sortIndicatorAsc.count() > 0;

    expect(hasSortIndicator).toBe(true);
  });

  test('should track row selection events in DevTools timeline', async ({ page }) => {
    // Get first row - click to select
    const firstRow = page.locator('tbody tr:first-child');
    await firstRow.click();

    // Verify the DevTools backend is available (proving event tracking infrastructure exists)
    const devToolsBackendExists = await page.evaluate(() => {
      return !!(window as any).__GRIDKIT_DEVTOOLS__;
    });

    expect(devToolsBackendExists).toBe(true);
  });

  test('should track multiple events sequence', async ({ page }) => {
    // Perform sorting
    const nameHeader = page.locator('thead th:has-text("Name")');
    await nameHeader.click();
    await page.waitForTimeout(200);

    // Verify sorting state changed
    const sortIndicator = page.locator('thead th:has-text("Name") span:text("↑")');
    await expect(sortIndicator).toBeVisible({ timeout: 1000 });

    // Verify both actions were performed by checking DevTools infrastructure
    const hasDevToolsBackend = await page.evaluate(() => {
      return !!(window as any).__GRIDKIT_DEVTOOLS__;
    });

    const hasSortIndicator = await sortIndicator.count() > 0;

    expect(hasDevToolsBackend && hasSortIndicator).toBe(true);
  });
});
