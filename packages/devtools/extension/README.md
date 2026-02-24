# GridKit DevTools Extension

Расширение для браузера, которое позволяет интегрироваться с GridKit таблицами и отображать их состояние, события, производительность и память.

## Установка

### Для разработки

1. Соберите расширение:

```bash
cd packages/devtools
pnpm build:extension
```

2. Откройте Chrome/Edge и перейдите в `chrome://extensions/`

3. Включите "Режим разработчика"

4. Нажмите "Загрузить расширение" и выберите папку `packages/devtools/dist`

### Для разработки с hot-reload

```bash
cd packages/devtools
pnpm dev:extension
```

## Структура

- `extension/background.js` - фона расширения
- `extension/content.js` - content script для обнаружения таблиц
- `extension/devtools.js` - точка входа в панель DevTools
- `extension/panel/` - компоненты React панели

## Использование

1. Откройте DevTools (F12)

2. Нажмите на иконку GridKit DevTools

3. Вы увидите панель с:
   - Table Inspector - просмотр состояния таблицы
   - Event Timeline - история событий
   - Performance Monitor - метрики производительности
   - Memory Profiler - профиль памяти
   - Plugin Inspector - плагины
   - State Diff Viewer - сравнение состояний
   - Time Travel Controls - управление time-travel

## Разработка

### Добавление нового компонента

1. Создайте файл в `extension/panel/components/`
2. Импортируйте `devToolsBridge` из `@gridkit/devtools-bridge/DevToolsBridge`
3. Используйте `sendCommand` для отправки команд:
   ```typescript
   devToolsBridge.sendCommand({
     type: 'GET_STATE',
     tableId: 'table-id',
     timestamp: Date.now()
   })
   ```

### Типы команд

- `GET_TABLES` - получить список таблиц
- `GET_STATE` - получить состояние таблицы
- `GET_EVENTS` - получить историю событий
- `GET_PERFORMANCE` - получить метрики производительности
- `GET_MEMORY` - получить профиль памяти
- `GET_PLUGINS` - получить список плагинов
- `GET_SNAPSHOTS` - получить снимки состояния
- `TIME_TRAVEL` - перейти к снимку
- `SET_FILTER` - установить фильтр
