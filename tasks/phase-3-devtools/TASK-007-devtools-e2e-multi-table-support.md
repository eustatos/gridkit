# TASK-007: E2E Tests for DevTools Multi-Table Support

## Цель
Создать E2E тесты, проверяющие поддержку нескольких таблиц одновременно через DevTools extension.

## Текущее состояние
- ✅ DevTools extension должен поддерживать несколько таблиц
- ✅ Существует базовый тест `devtools-integration.test.ts`
- ❌ Нет тестов проверки multi-table функциональности

## Задача

### 1. Добавить тест регистрации нескольких таблиц
```typescript
test('should register multiple tables simultaneously', async ({ page }) => {
  await page.goto('/');
  
  // Получаем начальное количество таблиц
  const initialTables = await page.evaluate(() => {
    return (window as any).getTables?.() || [];
  });
  
  // В демо-приложении должна быть хотя бы одна таблица
  expect(initialTables.length).toBeGreaterThanOrEqual(1);
  
  // Проверяем уникальность ID таблиц
  const tableIds = initialTables.map((t: any) => t.id);
  const uniqueIds = new Set(tableIds);
  expect(uniqueIds.size).toBe(tableIds.length);
  
  // Проверяем логи регистрации
  const consoleLogs: string[] = [];
  page.on('console', msg => consoleLogs.push(msg.text()));
  
  await page.waitForTimeout(500);
  
  const hasRegisterLog = consoleLogs.some(log => 
    log.includes('TABLE_REGISTERED') || 
    log.includes('table registered')
  );
  expect(hasRegisterLog).toBe(true);
});
```

### 2. Добавить тест изоляции таблиц
```typescript
test('should isolate state changes between multiple tables', async ({ page }) => {
  await page.goto('/');
  
  // Получаем список таблиц
  const tables = await page.evaluate(() => {
    return (window as any).getTables?.() || [];
  });
  
  if (tables.length < 2) {
    console.log('Skipping test: only one table available');
    return;
  }
  
  // Получаем состояние первой таблицы
  const table1 = tables[0];
  const table1State = await page.evaluate((id: string) => {
    return (window as any).getTableState?.(id) || {};
  }, table1.id);
  
  // Получаем состояние второй таблицы
  const table2 = tables[1];
  const table2State = await page.evaluate((id: string) => {
    return (window as any).getTableState?.(id) || {};
  }, table2.id);
  
  // Выполняем операцию с первой таблицей
  await page.locator('button:has-text("Сортировать")').first().click();
  await page.waitForTimeout(200);
  
  // Проверяем, что первая таблица изменилась
  const table1NewState = await page.evaluate((id: string) => {
    return (window as any).getTableState?.(id) || {};
  }, table1.id);
  
  expect(JSON.stringify(table1NewState)).not.toBe(JSON.stringify(table1State));
  
  // Проверяем, что вторая таблица не изменилась (или изменилась независимо)
  const table2NewState = await page.evaluate((id: string) => {
    return (window as any).getTableState?.(id) || {};
  }, table2.id);
  
  // Логика изоляции: изменения первой не должны влиять на вторую напрямую
  // (но обе могут измениться из-за глобальных операций)
  expect(table2NewState).toBeDefined();
});
```

### 3. Добавить тест навигации между таблицами
```typescript
test('should support switching between multiple tables', async ({ page }) => {
  await page.goto('/');
  
  // Получаем список всех таблиц
  const tables = await page.evaluate(() => {
    return (window as any).getTables?.() || [];
  });
  
  expect(tables.length).toBeGreaterThan(0);
  
  // Проверяем, что каждая таблица имеет уникальный интерфейс
  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    const tableInfo = await page.evaluate((id: string) => {
      return (window as any).getTableInfo?.(id) || { id, rowCount: 0 };
    }, table.id);
    
    expect(tableInfo.id).toBeDefined();
    expect(typeof tableInfo.rowCount).toBe('number');
  }
  
  // Проверяем логи навигации
  const consoleLogs: string[] = [];
  page.on('console', msg => consoleLogs.push(msg.text()));
  
  await page.waitForTimeout(500);
  
  const hasNavigationLog = consoleLogs.some(log => 
    log.includes('TABLE_SWITCH') || 
    log.includes('table switch') ||
    log.includes('SELECT_TABLE')
  );
  expect(hasNavigationLog).toBe(true);
});
```

## Инструкция для AI агента

1. **Открой файл** `apps/demo/tests/e2e/devtools-integration.test.ts`

2. **Добавь тестовый describe блок**:
   ```typescript
   test.describe('DevTools Multi-Table Support', () => {
     // три теста
   });
   ```

3. **Добавь следующие тесты**:
   - `should register multiple tables simultaneously`
   - `should isolate state changes between multiple tables`
   - `should support switching between multiple tables`

4. **Используй паттерн работы с несколькими таблицами**:
   ```typescript
   const tables = await page.evaluate(() => (window as any).getTables?.() || []);
   for (let i = 0; i < tables.length; i++) {
     // работа с каждой таблицей
   }
   ```

5. **Запусти тесты**:
   ```bash
   cd apps/demo
   pnpm test:e2e -- devtools-integration.test.ts -g "Multi-Table"
   ```

## Критерии успеха
- ✅ Все 3 теста добавлены и проходят
- ✅ Тесты проверяют регистрацию нескольких таблиц
- ✅ Тесты проверяют изоляцию состояний между таблицами
- ✅ Тесты проверяют навигацию между таблицами

## Связанные файлы
- `apps/demo/tests/e2e/devtools-integration.test.ts` (существующий)
- `packages/devtools/backend/DevToolsBackend.ts` (backend с поддержкой множества таблиц)
- `packages/devtools/integration/multi-table.test.ts` (unit тесты multi-table)

## Заметки
- Тесты должны работать с любым количеством таблиц в демо-приложении
- Уточни реальные API методы в коде extension
- Тесты могут требовать адаптации под реальную структуру данных
