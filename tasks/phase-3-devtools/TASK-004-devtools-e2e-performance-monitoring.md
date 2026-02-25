# TASK-004: E2E Tests for DevTools Performance Monitoring

## Цель
Создать E2E тесты, проверяющие мониторинг производительности через DevTools extension Performance Monitor.

## Текущее состояние
- ✅ DevTools extension имеет компонент PerformanceMonitor
- ✅ Существует базовый тест `devtools-integration.test.ts`
- ❌ Нет тестов проверки мониторинга производительности

## Задача

### 1. Добавить тест мониторинга рендеринга
```typescript
test('should monitor table rendering performance', async ({ page }) => {
  await page.goto('/');
  
  // Записываем время начала
  const startTime = Date.now();
  
  // Выполняем несколько операций, вызывающих рендеринг
  for (let i = 0; i < 5; i++) {
    const sortButton = page.locator('button:has-text("Сортировать")').first();
    await sortButton.click();
    await page.waitForTimeout(100);
  }
  
  // Записываем время окончания
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Проверяем, что операции завершились за разумное время
  expect(duration).toBeLessThan(5000); // 5 секунд для 5 операций
  
  // Проверяем логи производительности
  const consoleLogs: string[] = [];
  page.on('console', msg => consoleLogs.push(msg.text()));
  
  await page.waitForTimeout(500);
  
  // Ищем логи производительности
  const hasPerformanceLog = consoleLogs.some(log => 
    log.includes('PERFORMANCE') || 
    log.includes('performance') ||
    log.includes('render')
  );
  expect(hasPerformanceLog).toBe(true);
});
```

### 2. Добавить тест мониторинга памяти
```typescript
test('should monitor memory usage during operations', async ({ page }) => {
  await page.goto('/');
  
  const memoryLogs: string[] = [];
  page.on('console', msg => {
    if (msg.text().includes('MEMORY') || msg.text().includes('memory')) {
      memoryLogs.push(msg.text());
    }
  });
  
  // Выполняем интенсивные операции
  for (let i = 0; i < 10; i++) {
    await page.locator('button:has-text("Сортировать")').first().click();
    await page.waitForTimeout(50);
  }
  
  await page.waitForTimeout(500);
  
  // Проверяем, что логи памяти были записаны
  expect(memoryLogs.length).toBeGreaterThan(0);
  
  // Проверяем формат логов памяти
  // (уточнить реальный формат после просмотра кода)
  const hasMemoryInfo = memoryLogs.some(log => 
    log.includes('MB') || log.includes('bytes') || /\d+\.\d+/.test(log)
  );
  expect(hasMemoryInfo).toBe(true);
});
```

### 3. Добавить тест сравнения производительности
```typescript
test('should compare performance before and after operations', async ({ page }) => {
  await page.goto('/');
  
  // Получаем начальную метрику
  const initialMetrics = await page.evaluate(() => {
    // Предполагаем, что есть API для получения метрик
    return (window as any).getPerformanceMetrics?.() || {
      renderCount: 0,
      lastRenderDuration: 0
    };
  });
  
  // Выполняем операции
  await page.locator('button:has-text("Сортировать")').first().click();
  await page.waitForTimeout(200);
  
  // Получаем метрики после операций
  const finalMetrics = await page.evaluate(() => {
    return (window as any).getPerformanceMetrics?.() || {
      renderCount: 0,
      lastRenderDuration: 0
    };
  });
  
  // Проверяем, что счетчик рендеров увеличился
  expect(finalMetrics.renderCount).toBeGreaterThan(initialMetrics.renderCount);
  
  // Проверяем, что длительность рендеринга разумна
  expect(finalMetrics.lastRenderDuration).toBeLessThan(1000); // 1 секунда
});
```

## Инструкция для AI агента

1. **Открой файл** `apps/demo/tests/e2e/devtools-integration.test.ts`

2. **Добавь тестовый describe блок**:
   ```typescript
   test.describe('DevTools Performance Monitoring', () => {
     // три теста
   });
   ```

3. **Добавь следующие тесты**:
   - `should monitor table rendering performance`
   - `should monitor memory usage during operations`
   - `should compare performance before and after operations`

4. **Используй паттерн замера времени**:
   ```typescript
   const startTime = Date.now();
   // операции
   const endTime = Date.now();
   const duration = endTime - startTime;
   ```

5. **Запусти тесты**:
   ```bash
   cd apps/demo
   pnpm test:e2e -- devtools-integration.test.ts -g "Performance"
   ```

## Критерии успеха
- ✅ Все 3 теста добавлены и проходят
- ✅ Тесты проверяют рендеринг и память
- ✅ Тесты сравнивают метрики до и после операций
- ✅ Используются реальные console логи от DevTools

## Связанные файлы
- `apps/demo/tests/e2e/devtools-integration.test.ts` (существующий)
- `apps/demo/tests/e2e/performance.test.ts` (пример тестов производительности)
- `packages/devtools/extension/panel/components/PerformanceMonitor.tsx` (UI компонент)
- `packages/devtools/extension/panel/components/MemoryProfiler.tsx` (UI компонент памяти)

## Заметки
- Тесты должны учитывать реальные метрики, предоставляемые DevTools
- Уточни формат логов производительности в коде extension
- Тесты могут требовать адаптации под реальные API метрик
