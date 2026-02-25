# TASK-008: E2E Tests for DevTools Memory Management

## Цель
Создать E2E тесты, проверяющие управление памятью через DevTools extension Memory Profiler.

## Текущее состояние
- ✅ DevTools extension имеет компонент MemoryProfiler
- ✅ Существует базовый тест `devtools-integration.test.ts`
- ❌ Нет тестов проверки управления памятью

## Задача

### 1. Добавить тест проверки утечек памяти
```typescript
test('should detect memory leaks during operations', async ({ page }) => {
  await page.goto('/');
  
  // Получаем начальное использование памяти
  const initialMemory = await page.evaluate(() => {
    return (window as any).getMemoryUsage?.() || { usedJSHeapSize: 0, jsHeapSizeLimit: 0 };
  });
  
  // Выполняем интенсивные операции
  for (let i = 0; i < 10; i++) {
    await page.locator('button:has-text("Сортировать")').first().click();
    await page.waitForTimeout(50);
  }
  
  // Получаем конечное использование памяти
  const finalMemory = await page.evaluate(() => {
    return (window as any).getMemoryUsage?.() || { usedJSHeapSize: 0, jsHeapSizeLimit: 0 };
  });
  
  // Проверяем, что память выделена
  expect(finalMemory.usedJSHeapSize).toBeGreaterThan(0);
  
  // Проверяем, что память не превысила лимит
  expect(finalMemory.usedJSHeapSize).toBeLessThan(finalMemory.jsHeapSizeLimit);
  
  // Проверяем логи памяти
  const consoleLogs: string[] = [];
  page.on('console', msg => consoleLogs.push(msg.text()));
  
  await page.waitForTimeout(500);
  
  const hasMemoryLog = consoleLogs.some(log => 
    log.includes('MEMORY') || 
    log.includes('memory') ||
    log.includes('LEAK')
  );
  expect(hasMemoryLog).toBe(true);
});
```

### 2. Добавить тест очистки ресурсов при удалении таблиц
```typescript
test('should clean up resources when tables are unregistered', async ({ page }) => {
  await page.goto('/');
  
  // Получаем начальное состояние памяти
  const initialMemory = await page.evaluate(() => {
    return (window as any).getMemoryUsage?.() || { usedJSHeapSize: 0 };
  });
  
  // Получаем количество таблиц
  const initialTablesCount = await page.evaluate(() => {
    return (window as any).getTables?.().length || 0;
  });
  
  // Выполняем операции, создающие таблицы (если есть функционал добавления)
  // В демо-приложении может не быть, поэтому проверяем через console
  
  // Проверяем логи очистки
  const consoleLogs: string[] = [];
  page.on('console', msg => consoleLogs.push(msg.text()));
  
  await page.waitForTimeout(500);
  
  const hasCleanupLog = consoleLogs.some(log => 
    log.includes('CLEANUP') || 
    log.includes('cleanup') ||
    log.includes('UNREGISTER') ||
    log.includes('unregister')
  );
  
  // Ожидаем, что есть хотя бы логи об очистке
  expect(hasCleanupLog).toBe(true);
});
```

### 3. Добавить тест мониторинга GC (Garbage Collection)
```typescript
test('should monitor garbage collection events', async ({ page }) => {
  await page.goto('/');
  
  const gcEvents: string[] = [];
  page.on('console', msg => {
    if (msg.text().includes('GC') || msg.text().includes('garbage')) {
      gcEvents.push(msg.text());
    }
  });
  
  // Выполняем интенсивные операции, требующие GC
  for (let i = 0; i < 20; i++) {
    await page.locator('button:has-text("Сортировать")').first().click();
    await page.waitForTimeout(50);
  }
  
  await page.waitForTimeout(1000); // Ждем GC
  
  // Проверяем, что GC события были записаны
  expect(gcEvents.length).toBeGreaterThan(0);
  
  // Проверяем логи памяти
  const memoryLogs: string[] = [];
  page.on('console', msg => {
    if (msg.text().includes('MEMORY') || msg.text().includes('memory')) {
      memoryLogs.push(msg.text());
    }
  });
  
  await page.waitForTimeout(500);
  
  const hasMemoryInfo = memoryLogs.some(log => 
    log.includes('MB') || 
    log.includes('bytes') ||
    /\d+\.\d+/.test(log)
  );
  expect(hasMemoryInfo).toBe(true);
});
```

## Инструкция для AI агента

1. **Открой файл** `apps/demo/tests/e2e/devtools-integration.test.ts`

2. **Добавь тестовый describe блок**:
   ```typescript
   test.describe('DevTools Memory Management', () => {
     // три теста
   });
   ```

3. **Добавь следующие тесты**:
   - `should detect memory leaks during operations`
   - `should clean up resources when tables are unregistered`
   - `should monitor garbage collection events`

4. **Используй паттерн мониторинга памяти**:
   ```typescript
   const memoryUsage = await page.evaluate(() => (window as any).getMemoryUsage?.() || {});
   expect(memoryUsage.usedJSHeapSize).toBeGreaterThan(0);
   ```

5. **Запусти тесты**:
   ```bash
   cd apps/demo
   pnpm test:e2e -- devtools-integration.test.ts -g "Memory"
   ```

## Критерии успеха
- ✅ Все 3 теста добавлены и проходят
- ✅ Тесты проверяют измерение памяти
- ✅ Тесты проверяют очистку ресурсов
- ✅ Тесты проверяют события GC
- ✅ Используются реальные console логи от DevTools

## Связанные файлы
- `apps/demo/tests/e2e/devtools-integration.test.ts` (существующий)
- `packages/devtools/extension/panel/components/MemoryProfiler.tsx` (UI компонент)
- `packages/devtools/backend/DevToolsBackend.ts` (backend с memory tracking)

## Заметки
- Тесты проверяют API memory management, не визуальный profiler
- Уточни реальные API методы в коде extension
- Тесты могут требовать адаптации под реальные методы измерения памяти
