module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: [
    "@typescript-eslint",
    "react",
    "jsx-a11y",
    "jest"
  ],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "prettier",
    "plugin:storybook/recommended",
    "plugin:jest/recommended"
  ],
  "settings": {
    "react": {
      "version": "detect",
    },
  },
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true,
    },
  },
  "reportUnusedDisableDirectives": true,
  "rules": {
    "no-console": "error",
    "prefer-rest-params": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-non-null-assertion": "error",
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
