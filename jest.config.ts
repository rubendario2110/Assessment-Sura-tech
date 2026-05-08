import type { Config } from "jest";

/**
 * Jest config — tests live under `test/{unit,integration,e2e}` and mirror source paths.
 * `@assessment/integration-framework` is mapped to its workspace source for fast feedback.
 */
const config: Config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  testMatch: ["<rootDir>/test/**/*.spec.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  moduleNameMapper: {
    "^@assessment/integration-framework$":
      "<rootDir>/packages/integration-framework/src/index.ts",
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
  collectCoverageFrom: [
    "packages/integration-framework/src/**/*.ts",
    "src/contexts/**/*.ts",
    "!**/*.spec.ts",
    "!**/main.ts",
    "!**/*.module.ts",
    "!**/tokens.ts",
    "!**/*.command.ts",
    "!**/*.query.ts",
    "!**/*.event.ts",
    "!**/dto/**",
    "!**/interfaces/**",
    "!**/integration-http-client.provider.ts",
    "!**/idempotency-store.port.ts",
    "!**/failure-rate-repository.port.ts",
  ],
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  coverageThreshold: {
    global: {
      lines: 100,
      statements: 100,
      functions: 100,
      branches: 90,
    },
  },
  coverageReporters: ["text", "text-summary", "lcov", "json-summary"],
};

export default config;
