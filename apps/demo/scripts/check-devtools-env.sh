#!/bin/bash

echo "Checking DevTools E2E test environment..."

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found"
    exit 1
fi
echo "✅ Node.js found: $(node --version)"

# Проверка pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm not found"
    exit 1
fi
echo "✅ pnpm found: $(pnpm --version)"

# Проверка playwright
if ! command -v npx &> /dev/null; then
    echo "❌ Playwright not installed"
    exit 1
fi
echo "✅ Playwright installed"

# Проверка браузеров
echo "Checking browsers..."
npx playwright install chromium
echo "✅ Chromium installed"

echo "✅ Environment check passed"
