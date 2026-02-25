# TASK-003: E2E Tests for DevTools Events Timeline

## Цель
Создать E2E тесты, проверяющие отслеживание событий через DevTools extension Event Timeline.

## Текущее состояние
- ✅ DevTools extension имеет компонент EventTimeline
- ✅ Существует базовый тест `devtools-integration.test.ts`
- ❌ Нет тестов проверки отслеживания событий таблицы

## Задача

### 1. Добавить тест отслеживания событий сортировки
```typescript
test('should track sorting events in DevTools timeline', async ({ page }) => {
  await page.goto('/');
  
  // Получаем начальное состояние
  const initialSort = await page.evaluate(() => {
    // Предполагаем, что есть способ получить текущую сортировку
    return (window as any).tableState?.sort || null;
  });
  
  // Выполняем действие сортировки
  const sortButton = page.locator('button:has-text("Сортировать")').first();
  await sortButton.click();
  
  // Проверяем, что событие сортировки было отправлено в DevTools
  const consoleLogs: string[] = [];
  page.on('console', msg => consoleLogs.push(msg.text()));
  
  await page.waitForTimeout(500);
  
  // Ищем лог события сортировки
  const hasSortEvent = consoleLogs.some(log => 
    log.includes('SORTING') || log.includes('sorting')
  );
  expect(hasSortEvent).toBe(true);
});
```

### 2. Добавить тест отслеживания событий выбора строк
```typescript
test('should track row selection events in DevTools timeline', async ({ page }) => {
  await page.goto('/');
  
  // Выбираем первую строку
  const firstRowCheckbox = page.locator('tbody tr:first-child input[type="checkbox"]');
  await firstRowCheckbox.click();
  
  // Проверяем логи DevTools
  const consoleLogs: string[] = [];
  page.on('console', msg => consoleLogs.push(msg.text()));
  
  await page.waitForTimeout(500);
  
  // Ищем лог события выбора
  const hasSelectionEvent = consoleLogs.some(log => 
    log.includes('SELECT') || log.includes('selection')
  );
  expect(hasSelectionEvent).toBe(true);
});
```

### 3. Добавить тест отслеживания нескольких событий
```typescript
test('should track multiple events sequence', async ({ page }) => {
  await page.goto('/');
  
  const events: string[] = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('SORTING') || text.includes('SELECTION') || text.includes('EXPANSION')) {
      events.push(text);
    }
  });
  
  // Выполняем несколько действий
  await page.locator('button:has-text("Сортировать")').first().click();
  await page.waitForTimeout(200);
  
  await page.locator('tbody tr:first-child input[type="checkbox"]').click();
  await page.waitForTimeout(200);
  
  // Проверяем, что все события были зафиксированы
  expect(events.length).toBeGreaterThanOrEqual(2);
  
  // Проверяем порядок событий (сортировка раньше выбора)
  expect(events[0]).toMatch(/SORTING|SELECTION/i);
  expect(events[1]).toMatch(/SORTING|SELECTION/i);
});
```

## Инструкция для AI агента

1. **Открой файл** `apps/demo/tests/e2e/devtools-integration.test.ts`

2. **Добавь тестовый describe блок**:
   ```typescript
   test.describe('DevTools Events Timeline', () => {
     // три теста
   });
   ```

3. **Добавь следующие тесты**:
   - `should track sorting events in DevTools timeline`
   - `should track row selection events in DevTools timeline`
   - `should track multiple events sequence`

4. **Используй паттерн захвата console logs**:
   ```typescript
   const consoleLogs: string[] = [];
   page.on('console', msg => consoleLogs.push(msg.text()));
   ```

5. **Запусти тесты**:
   ```bash
   cd apps/demo
   pnpm test:e2e -- devtools-integration.test.ts -g "Events Timeline"
   ```

## Критерии успеха
- ✅ Все 3 теста добавлены и проходят
- ✅ Тесты проверяют различные типы событий
- ✅ Тесты проверяют последовательность событий
- ✅ Используются реальные console логи от DevTools

## Связанные файлы
- `apps/demo/tests/e2e/devtools-integration.test.ts` (существующий)
- `apps/demo/tests/e2e/sorting.test.ts` (пример тестов сортировки)
- `apps/demo/tests/e2e/row-selection.test.ts` (пример тестов выбора)
- `packages/devtools/extension/panel/components/EventTimeline.tsx` (UI компонент)

## Заметки
- События в DevTools отображаются в timeline
- Убедись, что DevTools extension загружен в браузере
- Тесты могут требовать адаптации под реальные имена кнопок в DemoApp
