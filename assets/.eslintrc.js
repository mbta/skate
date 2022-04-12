module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: [
    "@typescript-eslint",
  ],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "prettier",
  ],
  "settings": {
    "react": {
      "version": "detect",
    },
  },
  "reportUnusedDisableDirectives": true,
  "rules": {
    "no-console": "error",
    "prefer-rest-params": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_.*",
        "varsIgnorePattern": "^_.*",
        "destructuredArrayIgnorePattern": "^_.*",
      }
    ],
    "react/display-name": "off",
    "react/function-component-definition": [
      "error",
      {
        "namedComponents": "arrow-function",
        "unnamedComponents": "arrow-function",
      },
    ],
    "react/hook-use-state": "error",
    "react/no-danger": "error",
  },
  "overrides": [
    {
      "files": [
        "tests/setup.tsx",
        "tests/testHelpers/touchEventHelpers.ts",
        "*.test.ts",
        "*.test.tsx",
      ],
      "rules": {
        "@typescript-eslint/ban-ts-comment": "off",
      },
    },
    {
      "files": [
        "*.test.ts",
        "*.test.tsx",
      ],
      "rules": {
        "@typescript-eslint/no-non-null-assertion": "off",
      },
    },
  ],
};
