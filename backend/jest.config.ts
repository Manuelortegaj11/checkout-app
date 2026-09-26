import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
  clearMocks: true,
  // Alias de tsconfig.json (paths).
  moduleNameMapper: {
    '^@(shared|domain|application|infrastructure|config)/(.*)$':
      '<rootDir>/$1/$2',
  },
  collectCoverageFrom: [
    '**/*.ts',
    // Solo arranque y cableado de NestJS: sin lógica que probar.
    '!main.ts',
    '!**/*.module.ts',
    '!**/index.ts',
  ],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'text-summary', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

export default config;
