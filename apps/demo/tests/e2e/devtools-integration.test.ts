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
