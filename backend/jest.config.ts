import type { Config } from 'jest';









const shared = {
  rootDir: '.',
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  testEnvironment: 'node',
  clearMocks: true,
  moduleNameMapper: {
    '^@(shared|domain|application|infrastructure|config)/(.*)$':
      '<rootDir>/src/$1/$2',
    '^@testing/(.*)$': '<rootDir>/tests/support/$1',
  },
} satisfies Config;

const config: Config = {
  projects: [
    {
      ...shared,
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.spec.ts'],
    },
    {
      ...shared,
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.int-spec.ts'],
    },
    {
      ...shared,
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.e2e-spec.ts'],
    },
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/index.ts',
    '!src/infrastructure/persistence/generated/**',
  ],
  coverageDirectory: 'coverage',
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
