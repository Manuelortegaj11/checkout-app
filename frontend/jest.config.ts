import type { Config } from 'jest';

const shared = {
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
  },
  moduleNameMapper: {
    '^@(app|features|shared|store)/(.*)$': '<rootDir>/src/$1/$2',
    '^@testing/(.*)$': '<rootDir>/tests/support/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/support/setup.ts'],
  clearMocks: true,
  restoreMocks: true,
} satisfies Config;

const config: Config = {
  projects: [
    {
      ...shared,
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.spec.{ts,tsx}'],
    },
    {
      ...shared,
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.int-spec.tsx'],
      setupFilesAfterEnv: [
        ...shared.setupFilesAfterEnv,
        '<rootDir>/tests/support/setup-integration.ts',
      ],
    },
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/main.tsx',
    '!src/features/*/index.ts',
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
