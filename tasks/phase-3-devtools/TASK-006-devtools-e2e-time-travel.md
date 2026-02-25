# TASK-006: E2E Tests for DevTools Time Travel

## Цель
Создать E2E тесты, проверяющие функциональность "Time Travel" (временная旅ерсия) через DevTools extension TimeTravelControls.

## Текущее состояние
- ✅ DevTools extension имеет компонент TimeTravelControls
- ✅ Существует базовый тест `devtools-integration.test.ts`
- ❌ Нет тестов проверки time travel функциональности

## Задача

### 1. Добавить тест time travel между состояниями
```typescript
test('should support time travel between states', async ({ page }) => {
  await page.goto('/');
  
  // Получаем начальное состояние
  const initialState = await page.evaluate(() => {
    // Предполагаем, что есть API для получения состояния
    return (window as any).getTableState?.() || {};
  });
  
  // Выполняем несколько операций, чтобы создать историю состояний
  for (let i = 0; i < 3; i++) {
    await page.locator('button:has-text("Сортировать")').first().click();
    await page.waitForTimeout(100);
  }
  
  // Получаем текущее состояние
  const currentState = await page.evaluate(() => {
    return (window as any).getTableState?.() || {};
  });
  
  // Проверяем, что состояние изменилось
  expect(JSON.stringify(currentState)).not.toBe(JSON.stringify(initialState));
  
  // Проверяем логи time travel
  const consoleLogs: string[] = [];
  page.on('console', msg => consoleLogs.push(msg.text()));
  
  await page.waitForTimeout(500);
  
  const hasTimeTravelLog = consoleLogs.some(log => 
    log.includes('TIME_TRAVEL') || 
    log.includes('time travel') ||
    log.includes('REVERT')
  );
  expect(hasTimeTravelLog).toBe(true);
});
```

### 2. Добавить тест навигации по истории состояний
```typescript
test('should navigate through state history with time travel', async ({ page }) => {
  await page.goto('/');
  
  // Записываем состояние после каждой операции
  const states: any[] = [];
  states.push(await page.evaluate(() => (window as any).getTableState?.() || {}));
  
  // Выполняем операции и записываем состояние
  for (let i = 0; i < 5; i++) {
    await page.locator('button:has-text("Сортировать")').first().click();
    await page.waitForTimeout(100);
    states.push(await page.evaluate(() => (window as any).getTableState?.() || {}));
  }
  
  // Проверяем, что история состояний создана
  expect(states.length).toBeGreaterThan(1);
  
  // Проверяем, что состояния различаются
  const uniqueStates = new Set(states.map(s => JSON.stringify(s)));
  expect(uniqueStates.size).toBeGreaterThan(1);
  
  // Проверяем логи навигации
  const consoleLogs: string[] = [];
  page.on('console', msg => consoleLogs.push(msg.text()));
  
  await page.waitForTimeout(500);
  
  const hasNavigationLog = consoleLogs.some(log => 
    log.includes('NAVIGATE') || 
    log.includes('navigation') ||
    log.includes('HISTORY')
  );
  expect(hasNavigationLog).toBe(true);
});
```

### 3. Добавить тест восстановления состояния
```typescript
test('should restore previous state with time travel', async ({ page }) => {
  await page.goto('/');
  
  // Получаем начальное состояние
  const initialState = await page.evaluate(() => {
    return (window as any).getTableState?.() || {};
  });
  
  // Выполняем операции
  await page.locator('button:has-text("Сортировать")').first().click();
  await page.waitForTimeout(100);
  
  const intermediateState = await page.evaluate(() => {
    return (window as any).getTableState?.() || {};
  });
  
  // Убеждаемся, что состояние изменилось
  expect(JSON.stringify(intermediateState)).not.toBe(JSON.stringify(initialState));
  
  // Выполняем еще одну операцию
  await page.locator('button:has-text("Сортировать")').first().click();
  await page.waitForTimeout(100);
  
  // Проверяем, что можно вернуться к предыдущему состоянию
  const restoredState = await page.evaluate(() => {
    return (window as any).restoreState?.(intermediateState) || 
           (window as any).getTableState?.() || {};
  });
  
  // Проверяем, что состояние восстановлено
  expect(JSON.stringify(restoredState)).toBe(JSON.stringify(intermediateState));
});
```

## Инструкция для AI агента

1. **Открой файл** `apps/demo/tests/e2e/devtools-integration.test.ts`

2. **Добавь тестовый describe блок**:
   ```typescript
   test.describe('DevTools Time Travel', () => {
     // три теста
   });
   ```

3. **Добавь следующие тесты**:
   - `should support time travel between states`
   - `should navigate through state history with time travel`
   - `should restore previous state with time travel`

4. **Используй паттерн сравнения состояний**:
   ```typescript
   const initialState = await page.evaluate(() => ...);
   // операции
   const finalState = await page.evaluate(() => ...);
   expect(JSON.stringify(finalState)).not.toBe(JSON.stringify(initialState));
   ```

5. **Запусти тесты**:
   ```bash
   cd apps/demo
   pnpm test:e2e -- devtools-integration.test.ts -g "Time Travel"
   ```

## Критерии успеха
- ✅ Все 3 теста добавлены и проходят
- ✅ Тесты проверяют создание и навигацию по истории состояний
- ✅ Тесты проверяют восстановление состояний
- ✅ Используются реальные console логи от DevTools

## Связанные файлы
- `apps/demo/tests/e2e/devtools-integration.test.ts` (существующий)
- `packages/devtools/extension/panel/components/TimeTravelControls.tsx` (UI компонент)
- `docs/debug/debug-system.md` (система отладки)

## Заметки
- Тесты проверяют API time travel, не визуальные контролы
- Уточни реальные API методы в коде extension
- Тесты могут требовать адаптации под реальные методы time travel
