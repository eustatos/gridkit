module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ["@typescript-eslint"],
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  rules: {
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "no-debugger": "error",
    "prefer-const": "error",
    "no-var": "error",
  },
  ignorePatterns: [
    "dist/",
    "build/",
    "node_modules/",
    "coverage/",
    ".turbo/",
    "*.config.js",
    "jest.config.js",
    "vitest.config.js",
  ],
};
