#!/bin/bash

# Run all DevTools E2E tests
echo "Running DevTools E2E tests..."

# Запуск в нормальном режиме
pnpm test:e2e:devtools

# Проверка результата
if [ $? -ne 0 ]; then
    echo "❌ DevTools E2E tests failed"
    exit 1
fi

echo "✅ DevTools E2E tests passed"
