# @nexus-state/vue

Интеграция Nexus State с Vue

## Описание

Пакет `@nexus-state/vue` предоставляет инструменты для интеграции Nexus State с Vue-приложениями.

## Установка

```bash
npm install @nexus-state/vue
```

## Основные функции

- Плагины для интеграции с Vue
- Реактивные привязки к состоянию
- Поддержка Composition API и Options API

## Пример использования

```javascript
import { createStore } from '@nexus-state/vue';

const store = createStore({
  count: 0
});

// В Vue-компонентах
export default {
  data() {
    return {
      count: store.state.count
    };
  },
  methods: {
    increment() {
      store.setState({ count: this.count + 1 });
    }
  }
};
```

## Лицензия

MIT