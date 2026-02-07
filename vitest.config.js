import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    // Устанавливаем jsdom как среду по умолчанию для React тестов
    environment: "jsdom",
    include: [
      "tests/**/*.{test,spec}.{ts,js}",
      "packages/**/*.test.ts",
      "packages/**/*.spec.ts",
      "**/*.test.ts",
      "**/*.spec.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["src/**/*", "packages/**/*"],
      exclude: ["src/**/*.d.ts", "packages/**/*.d.ts"],
    },
    // Настройка среды для разных типов тестов
    environmentMatchGlobs: [
      // Для не-React тестов используем node
      ["packages/core/**/*.test.ts", "node"],
      ["packages/core/**/*.spec.ts", "node"],
      ["tests/**/*.test.ts", "node"],
      ["tests/**/*.spec.ts", "node"],
    ],
  },
});
