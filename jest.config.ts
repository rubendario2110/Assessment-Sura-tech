import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  testMatch: ["<rootDir>/test/**/*.spec.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@assessment/integration-framework$": "<rootDir>/packages/integration-framework/src/index.ts",
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
    "!packages/integration-framework/src/interfaces/http-request.ts",
    "!packages/integration-framework/src/interfaces/logger.ts",
    "src/contexts/**/*.ts",
    "!src/contexts/**/*.types.ts",
    "!src/contexts/**/*.port.ts",
    "!src/contexts/**/main.ts",
    "!src/contexts/channel/telemetry.ts",
  ],
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  coverageReporters: ["text", "text-summary", "lcov", "json-summary"],
  coverageThreshold: {
    global: {
      branches: 82,
      functions: 100,
      lines: 98,
      statements: 98,
    },
  },
};

export default config;
