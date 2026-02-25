# ✅ Демо-приложение создано!

## Что сделано

Создано полноценное демо-приложение для testing GridKit DevTools:

```
apps/demo/
├── package.json          # Конфигурация проекта
├── tsconfig.json         # TypeScript конфиг
├── vite.config.ts        # Конфигурация Vite
├── index.html            # Entry point
└── src/
    ├── main.tsx          # React entry
    └── DemoApp.tsx       # Главный компонент с таблицей
```

## Возможности демо

### Визуальные компоненты:
- ✅ Таблица с 50 строками реальных данных
- ✅ Сортировка по колонкам (клик по заголовкам)
- ✅ Пагинация (10 строк на страницу)
- ✅ Выбор строк (чекбоксы)
- ✅ Темная/светлая тема (переключатель)
- ✅ Уведомления о state changes (вкл/выкл)

### Колонки таблицы:
- Name (строка)
- Email (строка)
- Role (Admin/User/Viewer)
- Status (активный/неактивный с цветом)
- Salary (форматирована как USD)
- Join Date (ISO дата)

### Технические возможности:
- ✅ Отладка включена (`debug: true`)
- ✅ Логирование state changes в консоль
- ✅ Оптимизированный re-render через `useMemo`
- ✅ React 18 + TypeScript
- ✅ Type-safe данные

## Как использовать

### 1. Запустить демо
```bash
pnpm dev:demo
# или
cd apps/demo && pnpm dev
```

Откроется `http://localhost:3000`

### 2. Загрузить DevTools в Chrome
1. Перейдите в `chrome://extensions/`
2. Включите "Developer mode"
3. Нажмите "Load unpacked"
4. Выберите `packages/devtools/extension`

### 3. Проверить работу
- Откройте DevTools Extension (иконка GridKit)
- Увидите список таблиц
- Можно просматривать state, события, метрики

## Как разрабатывать DevTools

Если вы разрабатываете сам Extension:

```bash
# Пересобрать extension
cd packages/devtools
npm run build:extension

# В Chrome нажмите "Обновить" расширение (круглая стрелка)
# Обновите страницу с демо-приложением
```

## Важные ссылки

- **Демо-приложение**: `http://localhost:3000` (после `pnpm dev:demo`)
- **Chrome Extensions**: `chrome://extensions/`
- **DevTools Source**: `packages/devtools/`
- **Core Package**: `packages/core/`

## Структура демо-приложения

```
apps/demo/
├── src/DemoApp.tsx       # Главный компонент (150+ строк)
├── src/main.tsx          # React entry point
├── index.html            # HTML template
├── vite.config.ts        # Конфигурация сборки
└── package.json          # Зависимости
```

## Зависимости

- `@gridkit/core` - core таблицы
- `react@18.2.0` - UI framework
- `vite@5.0.8` - build tool

## Поддерживаемые функции для testing

### В таблице:
1. ✅ Сортировка (клик по заголовкам колонок)
2. ✅ Пагинация (переключение страниц)
3. ✅ Выбор строк (чекбоксы слева)
4. ✅ Тема (Dark/Light переключатель)
5. ✅ Уведомления (включить/выключить логирование)

### В DevTools Extension:
1. ✅ Просмотр state таблицы
2. ✅ Журнал событий (event log)
3. ✅ Performance метрики
4. ✅ Memory profiler
5. ✅ Plugin system

## Сборка для production

```bash
cd apps/demo
pnpm build
# Результат в apps/demo/dist/
```

## Дополнительная информация

- Полная документация: `docs/README.md`
- Architecutre: `docs/architecture/ARCHITECTURE.md`
- Contributing: `CONTRIBUTING.md`

---

**Статус**: ✅ Готово к использованию  
**Последнее обновление**: 2026-02-24  
**Версия**: 0.1.0
