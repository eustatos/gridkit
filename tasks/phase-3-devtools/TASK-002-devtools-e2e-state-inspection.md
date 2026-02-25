# TASK-002: E2E Tests for DevTools State Inspection

## Цель
Создать E2E тесты, проверяющие возможность просмотра состояния таблицы через DevTools extension.

## Текущее состояние
- ✅ DevTools extension имеет компонент TableInspector
- ✅ Существует базовый тест `devtools-integration.test.ts`
- ❌ Нет тестов визуальной инспекции состояния таблицы через DevTools

## Задача

### 1. Добавить тест инспекции таблицы
```typescript
test('should inspect table state through DevTools panel', async ({ page }) => {
  await page.goto('/');
  
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
```

### 2. Добавить тест инспекции данных
```typescript
test('should inspect table data content', async ({ page }) => {
  await page.goto('/');
  
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
```

### 3. Добавить тест инспекции metadata
```typescript
test('should inspect table metadata (id, rowCount, columnCount)', async ({ page }) => {
  await page.goto('/');
  
  // Проверка наличия статистики (из README демо-приложения)
  const stats = page.locator('div strong:has-text("Statistics:")');
  await expect(stats).toBeVisible();
  
  // Получаем текст статистики
  const statsText = await stats.textContent();
  
  // Проверяем, что статистика содержит информацию о таблице
  expect(statsText).toMatch(/rows?/i);
  expect(statsText).toMatch(/columns?/i);
});
```

## Инструкция для AI агента

1. **Открой файл** `apps/demo/tests/e2e/devtools-integration.test.ts`

2. **Добавь следующие тесты**:
   - `should inspect table state through DevTools panel`
   - `should inspect table data content`
   - `should inspect table metadata (id, rowCount, columnCount)`

3. **Используй Playwright locators**:
   - `page.locator('table')` - таблица
   - `page.locator('tbody tr')` - строки
   - `page.locator('thead th')` - колонки
   - `page.locator('td')` - ячейки

4. **Добавь описания на русском** (как в других тестах):
   ```typescript
   test.describe('DevTools Inspection', () => {
     // тесты
   });
   ```

5. **Запусти тесты**:
   ```bash
   cd apps/demo
   pnpm test:e2e -- devtools-integration.test.ts
   ```

## Критерии успеха
- ✅ Все 3 теста добавлены и проходят
- ✅ Тесты проверяют основные метрики таблицы
- ✅ Использованы локаторы Playwright (не document.querySelector)
- ✅ Добавлены assertions с понятными сообщениями об ошибках

## Связанные файлы
- `apps/demo/tests/e2e/devtools-integration.test.ts` (существующий)
- `apps/demo/tests/e2e/table-basics.test.ts` (пример тестов таблицы)
- `apps/demo/src/DemoApp.tsx` (как отображаются данные)

## Заметки
- Тесты должны работать с демо-данными (10 строк видно)
- Добавь `test.skip()` если DevTools extension не загружен
- Используй `test.info().annotations` для документации
