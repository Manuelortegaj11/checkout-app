import type { Config } from 'jest';

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
    '^@(shared|domain|application|infrastructure|config|testing)/(.*)$':
      '<rootDir>/../src/$1/$2',
  },
};

export default config;
