# TASK-001: E2E Tests for DevTools Extension Loading

## Цель
Создать E2E тесты в `apps/demo/tests/e2e/devtools-integration.test.ts`, проверяющие загрузку DevTools extension в браузере.

## Текущее состояние
- ✅ Существует файл `apps/demo/tests/e2e/devtools-integration.test.ts` с базовыми тестами
- ✅ Demo app настроен для работы с DevTools (описано в README)
- ❌ Тесты загрузки extension отсутствуют или неполные

## Задача

### 1. Добавить тест загрузки extension
```typescript
test('should load DevTools extension successfully', async ({ page }) => {
  // Переход на страницу
  await page.goto('/');
  
  // Проверка, что extension загружен (через console logs или DOM)
  const consoleLogs: string[] = [];
  page.on('console', msg => consoleLogs.push(msg.text()));
  
  // Ждем и проверяем логи
  await page.waitForTimeout(1000);
  
  // Extension должен отправить READY сообщение
  const hasReadyLog = consoleLogs.some(log => 
    log.includes('DevTools') && log.includes('ready')
  );
  expect(hasReadyLog).toBe(true);
});
```

### 2. Добавить тест обнаружения таблицы extension'ом
```typescript
test('should detect GridKit table automatically', async ({ page }) => {
  await page.goto('/');
  
  // Проверка, что extension обнаружил таблицу
  const consoleLogs: string[] = [];
  page.on('console', msg => consoleLogs.push(msg.text()));
  
  await page.waitForTimeout(1000);
  
  // Extension должен зарегистриовать таблицу
  const hasRegisterLog = consoleLogs.some(log => 
    log.includes('table') && log.includes('registered')
  );
  expect(hasRegisterLog).toBe(true);
});
```

### 3. Добавить тест взаимодействия с extension API
```typescript
test('should communicate with DevTools extension API', async ({ page }) => {
  await page.goto('/');
  
  // Проверка доступности extension API в консоли
  const apiExists = await page.evaluate(() => {
    return new Promise(resolve => {
      const check = () => {
        if (window.devToolsExtension || (window as any).gridkitDevTools) {
          resolve(true);
        } else if ((window as any).DevToolsBridge) {
          resolve(true);
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  });
  
  expect(apiExists).toBe(true);
});
```

## Инструкция для AI агента

1. **Открой файл** `apps/demo/tests/e2e/devtools-integration.test.ts`

2. **Добавь следующие тесты** (см. примеры выше):
   - `should load DevTools extension successfully`
   - `should detect GridKit table automatically`
   - `should communicate with DevTools extension API`

3. **Используй существующий pattern** из файла:
   - Используй `page.on('console')` для захвата логов
   - Используй `page.evaluate()` для проверки API в браузере
   - Добавь ожидания через `page.waitForTimeout()`

4. **Запусти тесты**:
   ```bash
   cd apps/demo
   pnpm test:e2e -- devtools-integration.test.ts
   ```

5. **Проверь результаты** - все тесты должны проходить

## Критерии успеха
- ✅ Все 3 теста добавлены и проходят
- ✅ Тесты проверяют полный цикл: загрузка → обнаружение → взаимодействие
- ✅ Тесты используют реальные логи из браузера
- ✅ Добавлены комментарии на русском языке (как в проекте)

## Связанные файлы
- `apps/demo/tests/e2e/devtools-integration.test.ts` (существующий)
- `apps/demo/tests/e2e/table-basics.test.ts` (пример структуры тестов)
- `apps/demo/README.md` (инструкции по подключению DevTools)

## Заметки
- Тесты должны работать в Chromium, Firefox и WebKit (настройки в playwright.config.ts)
- Используй `.only` для отладки одного теста: `test.only('...', ...)`
- Добавь `test.describe('DevTools Loading', ...)` для группировки
