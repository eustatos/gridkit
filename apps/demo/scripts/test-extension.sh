#!/bin/bash

# Build the extension first
echo "Building GridKit DevTools extension..."
cd ../../packages/devtools
pnpm build:extension

if [ $? -ne 0 ]; then
    echo "Extension build failed!"
    exit 1
fi

echo "Extension built successfully!"
cd -

# Run Playwright tests with extension
echo "Running Playwright tests with extension..."
npx playwright test tests/e2e/extension.test.ts --project=chromium-with-extension

# Check exit code
if [ $? -eq 0 ]; then
    echo "✅ Extension tests passed!"
else
    echo "❌ Extension tests failed!"
    exit 1
fi
