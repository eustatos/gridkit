# @nexus-state/web-worker

Интеграция Nexus State с Web Workers

## Описание

Пакет `@nexus-state/web-worker` предоставляет инструменты для работы с Nexus State в Web Workers.

## Установка

```bash
npm install @nexus-state/web-worker
```

## Основные функции

- Перенос логики состояния в Web Workers
- Асинхронная обработка тяжелых операций
- Коммуникация между основным потоком и Web Worker

## Пример использования

```javascript
import { createWorkerStore } from '@nexus-state/web-worker';

const workerStore = createWorkerStore({
  calculations: []
});

// Выполнение тяжелых вычислений в Web Worker
workerStore.dispatch({
  type: 'CALCULATE',
  payload: largeDataSet
});

// Подписка на результаты
workerStore.subscribe((state) => {
  console.log('Результаты вычислений:', state.calculations);
});
```

## Лицензия

MIT