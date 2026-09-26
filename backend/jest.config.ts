import type { Config } from 'jest';

/**
 * Una sola configuración con un proyecto por nivel de prueba. Cada script
 * elige el suyo con `--selectProjects` (ver package.json):
 *
 * - unit         tests/unit/**        *.spec.ts      una pieza aislada, espejo de src/
 * - integration  tests/integration/** *.int-spec.ts  varias piezas reales o NestJS, sin servicios externos
 * - e2e          tests/e2e/**         *.e2e-spec.ts  la API completa contra PostgreSQL y la pasarela reales
 */
const shared = {
  rootDir: '.',
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  testEnvironment: 'node',
  clearMocks: true,
  // Alias de tsconfig.json (paths).
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
      // Se ejecuta con `node --experimental-vm-modules` (ver `pnpm test:e2e`): el cliente
      // de Prisma 7 carga su motor con import() dinámico, que Jest solo permite con ese flag.
      ...shared,
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.e2e-spec.ts'],
    },
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    // Solo arranque y cableado de NestJS: sin lógica que probar.
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/index.ts',
    // Código generado por Prisma.
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
