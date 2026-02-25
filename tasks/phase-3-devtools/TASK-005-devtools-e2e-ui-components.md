# TASK-005: E2E Tests for DevTools UI Components

## Цель
Создать E2E тесты, проверяющие интерфейсные компоненты DevTools extension (TableInspector, StateDiffViewer, PluginInspector).

## Текущее состояние
- ✅ DevTools extension имеет несколько UI компонентов
- ✅ Существует базовый тест `devtools-integration.test.ts`
- ❌ Нет тестов визуальной проверки UI компонентов

## Задача

### 1. Добавить тест инспектора таблицы
```typescript
test('should display Table Inspector UI component', async ({ page }) => {
  await page.goto('/');
  
  // Проверяем, что DevTools extension загружен
  const hasDevToolsConsole = await page.evaluate(() => {
    return new Promise(resolve => {
      const check = () => {
        if ((window as any).DevToolsBridge || (window as any).devToolsExtension) {
          resolve(true);
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  });
  
  expect(hasDevToolsConsole).toBe(true);
  
  // Проверяем, что UI компонент TableInspector доступен
  const hasTableInspector = await page.evaluate(() => {
    return typeof (window as any).TableInspector === 'object' ||
           (window as any).tableInspector !== undefined;
  });
  
  expect(hasTableInspector).toBe(true);
});
```

### 2. Добавить тест инспектора состояния
```typescript
test('should display State Diff Viewer UI component', async ({ page }) => {
  await page.goto('/');
  
  // Выполняем операцию, изменяющую состояние
  await page.locator('button:has-text("Сортировать")').first().click();
  await page.waitForTimeout(200);
  
  // Проверяем, что State Diff Viewer доступен
  const hasStateDiff = await page.evaluate(() => {
    return typeof (window as any).StateDiffViewer === 'object' ||
           (window as any).stateDiffViewer !== undefined;
  });
  
  expect(hasStateDiff).toBe(true);
  
  // Проверяем, что состояние действительно изменилось
  const consoleLogs: string[] = [];
  page.on('console', msg => consoleLogs.push(msg.text()));
  
  await page.waitForTimeout(500);
  
  const hasStateDiffLog = consoleLogs.some(log => 
    log.includes('STATE_DIFF') || log.includes('state diff')
  );
  expect(hasStateDiffLog).toBe(true);
});
```

### 3. Добавить тест инспектора плагинов
```typescript
test('should display Plugin Inspector UI component', async ({ page }) => {
  await page.goto('/');
  
  // Проверяем, что Plugin Inspector доступен
  const hasPluginInspector = await page.evaluate(() => {
    return typeof (window as any).PluginInspector === 'object' ||
           (window as any).pluginInspector !== undefined;
  });
  
  expect(hasPluginInspector).toBe(true);
  
  // Проверяем логи плагинов
  const consoleLogs: string[] = [];
  page.on('console', msg => consoleLogs.push(msg.text()));
  
  await page.waitForTimeout(500);
  
  const hasPluginLog = consoleLogs.some(log => 
    log.includes('PLUGIN') || log.includes('plugin')
  );
  expect(hasPluginLog).toBe(true);
});
```

## Инструкция для AI агента

1. **Открой файл** `apps/demo/tests/e2e/devtools-integration.test.ts`

2. **Добавь тестовый describe блок**:
   ```typescript
   test.describe('DevTools UI Components', () => {
     // три теста
   });
   ```

3. **Добавь следующие тесты**:
   - `should display Table Inspector UI component`
   - `should display State Diff Viewer UI component`
   - `should display Plugin Inspector UI component`

4. **Используй паттерн проверки доступности API**:
   ```typescript
   const hasComponent = await page.evaluate(() => {
     return typeof (window as any).ComponentName === 'object';
   });
   expect(hasComponent).toBe(true);
   ```

5. **Запусти тесты**:
   ```bash
   cd apps/demo
   pnpm test:e2e -- devtools-integration.test.ts -g "UI Components"
   ```

## Критерии успеха
- ✅ Все 3 теста добавлены и проходят
- ✅ Тесты проверяют каждый UI компонент
- ✅ Тесты проверяют доступность API компонентов
- ✅ Используются реальные console логи от DevTools

## Связанные файлы
- `apps/demo/tests/e2e/devtools-integration.test.ts` (существующий)
- `packages/devtools/extension/panel/components/TableInspector.tsx` (UI компонент)
- `packages/devtools/extension/panel/components/StateDiffViewer.tsx` (UI компонент)
- `packages/devtools/extension/panel/components/PluginInspector.tsx` (UI компонент)
- `packages/devtools/extension/panel/components/EventTimeline.tsx` (UI компонент)

## Заметки
- Тесты проверяют только доступность API, не визуальный интерфейс
- Для визуального тестирования нужен инструмент вроде Playwright visual diff
- Уточни реальные имена API компонентов в коде extension
