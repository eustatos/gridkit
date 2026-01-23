# @nexus-state/svelte

Интеграция Nexus State с Svelte

## Описание

Пакет `@nexus-state/svelte` предоставляет инструменты для интеграции Nexus State с Svelte-приложениями.

## Установка

```bash
npm install @nexus-state/svelte
```

## Основные функции

- Хранилища, совместимые с Svelte
- Реактивные привязки к состоянию
- Поддержка Svelte-специфичных паттернов

## Пример использования

```javascript
import { createStore } from '@nexus-state/svelte';

const store = createStore({
  count: 0
});

// Использование в Svelte-компонентах
$: count = store.state.count;

function increment() {
  store.setState({ count: count + 1 });
}
```

## Лицензия

MIT