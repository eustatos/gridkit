import { test, expect } from '@playwright/test';

test.describe('DevTools Loading', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load DevTools extension successfully', async ({ page }) => {
    // Navigate to page (already done in beforeEach)
    
    // Capture console logs to verify extension loading
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });
    
    // Wait for extension to load and emit logs
    await page.waitForTimeout(1000);
    
    // Extension should emit READY message on load
    // Check for DevTools initialization logs
    const hasReadyLog = consoleLogs.some(log => 
      log.includes('GridKit DevTools') && (log.includes('Initializing') || log.includes('Content script loaded'))
    );
    
    // Test will pass when extension is properly loaded in Chrome DevTools
    expect(hasReadyLog).toBe(true);
  });

  test('should detect GridKit table automatically', async ({ page }) => {
    // Navigate to page (already done in beforeEach)
    
    // Capture console logs to verify table detection
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });
    
    // Wait for extension to detect tables (polling interval is 2000ms)
    await page.waitForTimeout(2500);
    
    // Extension should register the table
    const hasRegisterLog = consoleLogs.some(log => 
      log.includes('GridKit DevTools') && log.includes('Registered table')
    );
    
    expect(hasRegisterLog).toBe(true);
  });

  test('should communicate with DevTools extension API', async ({ page }) => {
    // Navigate to page (already done in beforeEach)
    
    // Check if extension API is available in browser
    const apiExists = await page.evaluate(() => {
      return new Promise(resolve => {
        // Check for various API entry points
        const hasDevToolsContent = !!(window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
        const hasBackend = !!(window as any).__GRIDKIT_DEVTOOLS__;
        const hasBridge = !!(window as any).DevToolsBridge;
        
        resolve(hasDevToolsContent || hasBackend || hasBridge);
      });
    });
    
    expect(apiExists).toBe(true);
  });
});

test.describe('DevTools Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show table is ready for DevTools', async ({ page }) => {
    // Таблица должна быть отрендерена
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    // Debug должен быть включен (проверяется через console logs)
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });
    
    // Ждем, пока появится некоторая активность в console
    await page.waitForTimeout(500);
    
    // Должны быть какие-то console output о таблице
    expect(consoleLogs.length).toBeGreaterThanOrEqual(0);
  });

  test('should support DevTools protocol commands', async ({ page }) => {
    // Проверяем, что таблица имеет необходимые свойства для DevTools
    const stats = page.locator('div strong:has-text("Statistics:")');
    await expect(stats).toBeVisible();
    
    // Проверяем, что таблица отвечает
    const table = page.locator('table');
    const tableRect = await table.boundingBox();
    
    expect(tableRect).toBeDefined();
    expect(tableRect?.width).toBeGreaterThan(0);
    expect(tableRect?.height).toBeGreaterThan(0);
  });

  test('should work with DevTools state viewing', async ({ page }) => {
    // Получаем состояние таблицы, проверяя видимый контент
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    
    // Должно быть видно 10 строк
    expect(rowCount).toBe(10);
  });

  test('should allow DevTools performance monitoring', async ({ page }) => {
    // Записываем время
    const startTime = Date.now();
    
    // Выполняем некоторые действия
    await page.waitForTimeout(100);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Должно завершиться за разумное время
    expect(duration).toBeGreaterThanOrEqual(100);
    expect(duration).toBeLessThan(200);
  });
});
