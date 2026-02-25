# TASK-009: E2E Tests for DevTools Integration with Demo Application

## Цель
Создать интеграционные E2E тесты, проверяющие полный цикл работы DevTools с демо-приложением.

## Текущее состояние
- ✅ Существует демо-приложение `apps/demo`
- ✅ Существует базовый тест `devtools-integration.test.ts`
- ❌ Нет полных интеграционных тестов end-to-end

## Задача

### 1. Добавить тест полного цикла интеграции
```typescript
test('should support complete integration cycle', async ({ page }) => {
  await page.goto('/');
  
  // 1. Проверка загрузки extension
  const extensionLoaded = await page.evaluate(() => {
    return (window as any).DevToolsBridge !== undefined ||
           (window as any).devToolsExtension !== undefined;
  });
  expect(extensionLoaded).toBe(true);
  
  // 2. Проверка регистрации таблицы
  const tablesRegistered = await page.evaluate(() => {
    return (window as any).getTables?.().length > 0;
  });
  expect(tablesRegistered).toBe(true);
  
  // 3. Проверка отслеживания событий
  const eventsTracked = await page.evaluate(() => {
    return (window as any).eventHistory?.length > 0 ||
           (window as any).getEventHistory?.()?.length > 0;
  });
  expect(eventsTracked).toBe(true);
  
  // 4. Проверка мониторинга производительности
  const performanceMonitored = await page.evaluate(() => {
    return (window as any).getPerformanceMetrics?.() !== undefined;
  });
  expect(performanceMonitored).toBe(true);
  
  // 5. Проверка мониторинга памяти
  const memoryMonitored = await page.evaluate(() => {
    return (window as any).getMemoryUsage?.() !== undefined;
  });
  expect(memoryMonitored).toBe(true);
});
```

### 2. Добавить тест взаимодействия всех компонентов
```typescript
test('should interact all DevTools components together', async ({ page }) => {
  await page.goto('/');
  
  // Выполняем несколько операций, затрагивающих разные компоненты
  const operations = [
    // Table Inspector
    () => page.locator('button:has-text("Сортировать")').first().click(),
    // Event Timeline
    () => page.locator('tbody tr:first-child input[type="checkbox"]').click(),
    // Performance Monitor
    () => page.locator('button:has-text("Сортировать")').nth(1).click(),
    // Time Travel
    () => page.locator('button:has-text("Сортировать")').nth(2).click(),
  ];
  
  // Выполняем операции
  for (const op of operations) {
    await op();
    await page.waitForTimeout(100);
  }
  
  // Проверяем логи всех компонентов
  const consoleLogs: string[] = [];
  page.on('console', msg => consoleLogs.push(msg.text()));
  
  await page.waitForTimeout(500);
  
  const hasTableLog = consoleLogs.some(log => 
    log.includes('TABLE') || log.includes('table')
  );
  const hasEventLog = consoleLogs.some(log => 
    log.includes('EVENT') || log.includes('event')
  );
  const hasPerformanceLog = consoleLogs.some(log => 
    log.includes('PERFORMANCE') || log.includes('performance')
  );
  
  expect(hasTableLog).toBe(true);
  expect(hasEventLog).toBe(true);
  expect(hasPerformanceLog).toBe(true);
});
```

### 3. Добавить тест интеграции с реальными действиями пользователя
```typescript
test('should handle real user actions end-to-end', async ({ page }) => {
  await page.goto('/');
  
  // Действие 1: Сортировка
  const sortButton = page.locator('button:has-text("Сортировать")').first();
  await sortButton.click();
  await page.waitForTimeout(100);
  
  // Действие 2: Выбор строки
  const firstRowCheckbox = page.locator('tbody tr:first-child input[type="checkbox"]');
  await firstRowCheckbox.click();
  await page.waitForTimeout(100);
  
  // Действие 3: Раскрытие строки (если есть)
  const firstRowExpandButton = page.locator('tbody tr:first-child button[aria-label="Expand"]');
  if (await firstRowExpandButton.count() > 0) {
    await firstRowExpandButton.click();
    await page.waitForTimeout(100);
  }
  
  // Проверяем, что все действия были зафиксированы DevTools
  const consoleLogs: string[] = [];
  page.on('console', msg => consoleLogs.push(msg.text()));
  
  await page.waitForTimeout(500);
  
  const actionTypes = [
    { keyword: 'SORT', name: 'sorting' },
    { keyword: 'SELECT', name: 'selection' },
    { keyword: 'EXPAND', name: 'expansion' },
  ];
  
  for (const action of actionTypes) {
    const hasAction = consoleLogs.some(log => log.includes(action.keyword));
    console.log(`Action ${action.name} detected: ${hasAction}`);
  }
  
  // Проверяем общее состояние
  const totalEvents = consoleLogs.length;
  expect(totalEvents).toBeGreaterThan(0);
});
```

## Инструкция для AI агента

1. **Открой файл** `apps/demo/tests/e2e/devtools-integration.test.ts`

2. **Добавь тестовый describe блок**:
   ```typescript
   test.describe('DevTools Full Integration', () => {
     // три теста
   });
   ```

3. **Добавь следующие тесты**:
   - `should support complete integration cycle`
   - `should interact all DevTools components together`
   - `should handle real user actions end-to-end`

4. **Используй паттерн проверки всех компонентов**:
   ```typescript
   const hasComponent = await page.evaluate(() => {
     return (window as any).ComponentName !== undefined;
   });
   expect(hasComponent).toBe(true);
   ```

5. **Запусти тесты**:
   ```bash
   cd apps/demo
   pnpm test:e2e -- devtools-integration.test.ts -g "Full Integration"
   ```

## Критерии успеха
- ✅ Все 3 теста добавлены и проходят
- ✅ Тесты проверяют полный цикл интеграции
- ✅ Тесты проверяют взаимодействие всех компонентов
- ✅ Тесты проверяют реальные действия пользователя

## Связанные файлы
- `apps/demo/tests/e2e/devtools-integration.test.ts` (существующий)
- `apps/demo/tests/e2e/sorting.test.ts` (пример тестов сортировки)
- `apps/demo/tests/e2e/row-selection.test.ts` (пример тестов выбора)
- `apps/demo/src/DemoApp.tsx` (реальные действия пользователя)

## Заметки
- Тесты должны работать с реальными действиями пользователя
- Уточни реальные имена кнопок и селекторов в DemoApp.tsx
- Тесты могут требовать адаптации под реальную структуру демо-приложения
