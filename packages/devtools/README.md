# @nexus-state/devtools

Инструменты разработчика для Nexus State

## Описание

Пакет `@nexus-state/devtools` предоставляет инструменты для отладки и разработки приложений на основе Nexus State.

## Установка

```bash
npm install @nexus-state/devtools
```

## Основные функции

- Интроспекция состояния
- Логирование изменений
- Интеграция с браузерными инструментами разработчика

## Пример использования

```javascript
import { createDevtools } from '@nexus-state/devtools';

const devtools = createDevtools();

// Подключение к вашему хранилищу
store.use(devtools);
```

## Лицензия

MIT