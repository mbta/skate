module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'prettier',
  ],
  "settings": {
    "react": {
      "version": "detect",
    },
  },
  "reportUnusedDisableDirectives": true,
  "rules": {
    "@typescript-eslint/no-explicit-any": "off",
    "react/display-name": "off",
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
        "prefer-rest-params": "off",
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/no-unused-vars": [
          "error",
          {
            "argsIgnorePattern": "^_.*",
            "varsIgnorePattern": "^_.*",
            "destructuredArrayIgnorePattern": "^_.*",
          }
        ],
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
