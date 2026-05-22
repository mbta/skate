import type { Config } from "jest"

const config: Config = {
  testEnvironment: "jsdom",
  clearMocks: true,
  transform: {
    "^.+\\.jsx?$": "babel-jest",
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "./tsconfig.test.json",
      },
    ],
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(@react-leaflet|react-leaflet|screenfull)/)",
  ],
  testRegex: "(src|tests)/.*\\.test\\.tsx?$",
  modulePaths: ["<rootDir>/src"],
  moduleFileExtensions: ["js", "json", "jsx", "node", "ts", "tsx"],
  moduleNameMapper: {
    "\\.(svg)$": "<rootDir>/tests/testHelpers/svgStubber.js",
    "\\.(css|less)$": "identity-obj-proxy",
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setup.tsx"],
  collectCoverage: true,
  globalSetup: "./tests/global-setup.js",
  preset: "ts-jest/presets/js-with-babel",
}

export default config
