# DevTools E2E Tests

Документация по запуску E2E тестов для DevTools extension.

## 📋 Предварительные требования

- Node.js 16+
- Chrome/Firefox/WebKit браузеры
- Playwright тесты

## 🚀 Запуск тестов

### Быстрый старт

```bash
cd apps/demo
pnpm install
pnpm dev &  # Запускаем dev server
pnpm test:e2e:devtools
```

### Запуск с UI

```bash
pnpm test:e2e:devtools:ui
```

### Запуск с headed режимом (видно браузер)

```bash
pnpm test:e2e:devtools:headed
```

### Запуск в debug режиме

```bash
pnpm test:e2e:devtools:debug
```

## 📊 Запуск конкретных тестов

### По названию

```bash
pnpm test:e2e:devtools -- -g "DevTools Loading"
```

### По тегу

```bash
pnpm test:e2e:devtools -- -g "@smoke"
```

### По файлу

```bash
pnpm test:e2e:devtools tests/e2e/devtools-integration.test.ts
```

## ⚙️ Конфигурация

### Playwright конфиг

Файл: `apps/demo/playwright.config.ts`

Настройки:
- Chromium (по умолчанию)
- Firefox
- WebKit (Safari)

### Запуск в CI

```bash
# Установка браузеров
npx playwright install

# Запуск
pnpm test:e2e:devtools

# С coverage
pnpm test:e2e:devtools -- --coverage
```

## 🐛 Отладка

### Визуальная отладка

```bash
pnpm test:e2e:devtools:headed
```

### Debug режим

```bash
pnpm test:e2e:devtools:debug
```

### Снимки экрана при ошибках

Снимки сохраняются в `playwright-report/` при падении тестов.

## 📈 Coverage

```bash
pnpm test:e2e:devtools -- --coverage
```

Coverage отчет сохраняется в `coverage/`.

## 🔄 Обновление скриншотов

```bash
pnpm test:e2e:devtools -u
```

## 📝 best Practices

1. ✅ Запускай тесты локально перед коммитом
2. ✅ Используй `test.skip()` для временного пропуска
3. ✅ Добавляй описания на русском языке
4. ✅ Проверяй в нескольких браузерах
5. ✅ Используй асинхронные ожидания (`waitForTimeout`)

## 🆘 Troubleshooting

### Тесты не проходят

1. Проверь, что DevTools extension загружен в браузере
2. Убедись, что dev server запущен
3. Проверь консоль браузера на ошибки
4. Запусти в headed режиме для визуальной отладки

### Extension не обнаруживается

1. Проверь manifest.json в extension
2. Убедись, что background.js загружен
3. Проверь console logs на READY сообщения

## 📚 Связанные файлы

- `apps/demo/tests/e2e/devtools-integration.test.ts` (тесты)
- `apps/demo/playwright.config.ts` (конфигурация)
- `packages/devtools/README.md` (DevTools extension)
