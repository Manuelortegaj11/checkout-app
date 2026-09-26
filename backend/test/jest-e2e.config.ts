import type { Config } from 'jest';

// Se ejecuta con `node --experimental-vm-modules` (ver `pnpm test:e2e`): el cliente
// de Prisma 7 carga su motor con import() dinámico, que Jest solo permite con ese flag.

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
  // Alias de tsconfig.json (paths).
  moduleNameMapper: {
    '^@(shared|domain|application|infrastructure|config)/(.*)$':
      '<rootDir>/../src/$1/$2',
    '^@testing/(.*)$': '<rootDir>/../tests/support/$1',
  },
};

export default config;
