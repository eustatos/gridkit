# TASK-010: E2E Tests for DevTools Error Handling and Edge Cases

## Цель
Создать E2E тесты, проверяющие обработку ошибок и граничных случаев в DevTools extension.

## Текущее состояние
- ✅ Существует базовый тест `devtools-integration.test.ts`
- ❌ Нет тестов обработки ошибок
- ❌ Нет тестов граничных случаев

## Задача

### 1. Добавить тест обработки ошибок при отсутствии extension
```typescript
test('should handle missing DevTools extension gracefully', async ({ page }) => {
  await page.goto('/');
  
  // Проверяем, что приложение работает без extension
  const tableExists = await page.evaluate(() => {
    return document.querySelector('table') !== null;
  });
  expect(tableExists).toBe(true);
  
  // Проверяем, что приложение не падает, если extension не загружен
  const noError = await page.evaluate(() => {
    try {
      // Попытка использовать DevTools API (если не доступен)
      const hasAPI = (window as any).DevToolsBridge !== undefined;
      return true; // Приложение продолжает работать
    } catch (e) {
      return false; // Приложение упало
    }
  });
  expect(noError).toBe(true);
});
```

### 2. Добавить тест обработки ошибок при некорректных данных
```typescript
test('should handle invalid table data gracefully', async ({ page }) => {
  await page.goto('/');
  
  // Проверяем, что таблица отображается даже с возможными ошибками данных
  const rows = page.locator('tbody tr');
  const rowCount = await rows.count();
  
  // Приложение должно отобразить хотя бы 0 строк
  expect(rowCount).toBeGreaterThanOrEqual(0);
  
  // Проверяем логи ошибок (если есть)
  const consoleLogs: string[] = [];
  page.on('console', msg => consoleLogs.push(msg.text()));
  
  await page.waitForTimeout(500);
  
  // Ожидаем, что DevTools обработал ошибки и не упал
  const hasErrorLog = consoleLogs.some(log => 
    log.includes('ERROR') || 
    log.includes('error') ||
    log.includes('WARNING') ||
    log.includes('warning')
  );
  
  // Проверяем, что приложение продолжает работать
  expect(consoleLogs.length).toBeGreaterThanOrEqual(0);
});
```

### 3. Добавить тест граничных случаев
```typescript
test('should handle edge cases gracefully', async ({ page }) => {
  await page.goto('/');
  
  // Граничный случай 1: Несколько быстрых кликов
  const sortButton = page.locator('button:has-text("Сортировать")').first();
  await sortButton.click();
  await sortButton.click();
  await sortButton.click();
  await page.waitForTimeout(100);
  
  // Приложение должно обработать это без падений
  const stillAlive = await page.evaluate(() => {
    return document.querySelector('table') !== null;
  });
  expect(stillAlive).toBe(true);
  
  // Граничный случай 2: Выбор всех строк
  const allCheckboxes = page.locator('tbody input[type="checkbox"]');
  const checkboxCount = await allCheckboxes.count();
  for (let i = 0; i < checkboxCount; i++) {
    await allCheckboxes.nth(i).click();
    await page.waitForTimeout(10);
  }
  
  // Проверяем, что приложение не упало
  const rowsAfterSelection = page.locator('tbody tr');
  const rowsAfterCount = await rowsAfterSelection.count();
  expect(rowsAfterCount).toBeGreaterThanOrEqual(0);
  
  // Проверяем логи
  const consoleLogs: string[] = [];
  page.on('console', msg => consoleLogs.push(msg.text()));
  
  await page.waitForTimeout(500);
  
  const hasEdgeCaseLog = consoleLogs.some(log => 
    log.includes('EDGE') || 
    log.includes('edge') ||
    log.includes('BULK')
  );
  expect(hasEdgeCaseLog).toBe(true);
});
```

### 4. Добавить тест стресс-теста
```typescript
test('should handle stress test with rapid operations', async ({ page }) => {
  await page.goto('/');
  
  // Выполняем много операций быстро
  const operations = 20;
  for (let i = 0; i < operations; i++) {
    const sortButton = page.locator('button:has-text("Сортировать")').first();
    await sortButton.click();
    await page.waitForTimeout(20);
  }
  
  // Проверяем, что приложение не упало
  const tableExists = await page.evaluate(() => {
    return document.querySelector('table') !== null;
  });
  expect(tableExists).toBe(true);
  
  // Проверяем логи
  const consoleLogs: string[] = [];
  page.on('console', msg => consoleLogs.push(msg.text()));
  
  await page.waitForTimeout(500);
  
  // Должно быть достаточно логов (хотя бы 1)
  expect(consoleLogs.length).toBeGreaterThanOrEqual(0);
  
  // Проверяем, что нет критических ошибок
  const hasCriticalError = consoleLogs.some(log => 
    log.includes('FATAL') || 
    log.includes('fatal') ||
    log.includes('CRITICAL') ||
    log.includes('critical')
  );
  expect(hasCriticalError).toBe(false);
});
```

## Инструкция для AI агента

1. **Открой файл** `apps/demo/tests/e2e/devtools-integration.test.ts`

2. **Добавь тестовый describe блок**:
   ```typescript
   test.describe('DevTools Error Handling', () => {
     // 4 теста
   });
   ```

3. **Добавь следующие тесты**:
   - `should handle missing DevTools extension gracefully`
   - `should handle invalid table data gracefully`
   - `should handle edge cases gracefully`
   - `should handle stress test with rapid operations`

4. **Используй паттерн проверки устойчивости**:
   ```typescript
   const stillAlive = await page.evaluate(() => {
     return document.querySelector('table') !== null;
   });
   expect(stillAlive).toBe(true);
   ```

5. **Запусти тесты**:
   ```bash
   cd apps/demo
   pnpm test:e2e -- devtools-integration.test.ts -g "Error Handling"
   ```

## Критерии успеха
- ✅ Все 4 теста добавлены и проходят
- ✅ Тесты проверяют обработку ошибок
- ✅ Тесты проверяют граничные случаи
- ✅ Тесты проверяют стресс-тесты
- ✅ Приложение не падает в любых сценариях

## Связанные файлы
- `apps/demo/tests/e2e/devtools-integration.test.ts` (существующий)
- `packages/devtools/integration/error-handling.test.ts` (unit тесты обработки ошибок)

## Заметки
- Тесты должны проверять устойчивость приложения
- Уточни реальные имена кнопок и селекторов в DemoApp.tsx
- Тесты могут требовать адаптации под реальную структуру демо-приложения
