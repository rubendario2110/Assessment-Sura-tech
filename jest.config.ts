import type { Config } from "jest";

/**
 * Tests live under `test/{unit,integration,e2e}` — empty until you add specs (TDD).
 */
const config: Config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  testMatch: ["<rootDir>/test/**/*.spec.ts"],
  passWithNoTests: true,
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "<rootDir>/tsconfig.json",
      },
    ],
  },
  collectCoverageFrom: ["src/**/*.ts"],
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  coverageReporters: ["text", "text-summary", "lcov", "json-summary"],
};

export default config;
