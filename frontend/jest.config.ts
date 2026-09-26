import type { Config } from 'jest';

/**
 * Una sola configuración con un proyecto por nivel de prueba, como en el
 * backend. Cada script elige el suyo con `--selectProjects` (ver package.json):
 *
 * - unit  tests/unit/**  *.spec.ts(x)  una pieza aislada, espejo de src/
 *
 * Las pruebas de integración (flujos del checkout con el store real) tendrán
 * su proyecto cuando exista el primer flujo.
 */
const shared = {
  rootDir: '.',
  // Jest solo indexa el código y las pruebas, no node_modules.
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
  },
  // Alias de tsconfig.test.json (paths).
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
  ],
  // `pnpm test:cov` mide la cobertura con las pruebas unitarias.
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    // Arranque: solo monta <App /> en el DOM.
    '!src/main.tsx',
    // API pública de cada feature: solo re-exporta.
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
