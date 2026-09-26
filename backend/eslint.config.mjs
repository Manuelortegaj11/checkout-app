// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Frameworks e infraestructura que el núcleo (shared + domain + application) no puede conocer.
const FRAMEWORK_IMPORTS = {
  regex: '^(@nestjs|@prisma)/|^(class-validator|class-transformer|express)$',
  message:
    'El núcleo no depende de frameworks ni de infraestructura (arquitectura hexagonal).',
};

// Capas prohibidas, tanto por alias (@infrastructure/...) como por ruta relativa (../infrastructure/...).
const forbiddenLayers = (layers) => ({
  regex: `(^@|/)(${layers.join('|')})(/|$)`,
  message:
    'Regla de dependencias: infrastructure → application → domain → shared. La configuración solo la lee infrastructure.',
});

// Entre carpetas se importa con alias; las rutas relativas solo para vecinos cercanos.
const LONG_RELATIVE_IMPORT = {
  regex: '^\\.\\./\\.\\./',
  message:
    'Usa los alias (@shared, @domain, @application, @infrastructure, @config, @testing) en lugar de subir más de un nivel.',
};

// Los fixtures y dobles de prueba solo existen para los tests.
const TESTING_IMPORTS = {
  regex: '^@testing/',
  message:
    'El código de producción no importa utilidades de test (@testing): solo los *.spec.ts.',
};

const restrictImports = (...patterns) => [
  'error',
  { patterns: [...patterns, LONG_RELATIVE_IMPORT] },
];

// ROP: los errores de negocio viajan como err(...), no como excepciones.
const NO_THROW = {
  selector: 'ThrowStatement',
  message:
    'Devuelve err(...) en lugar de lanzar (Railway Oriented Programming).',
};

const TEST_FILES = ['src/**/*.spec.ts', 'src/testing/**/*.ts', 'test/**/*.ts'];

/**
 * Reglas de una capa del núcleo. El código de producción además no puede
 * importar @testing; sus tests conservan la regla de dependencias de la capa.
 */
const coreLayer = (layer, patterns) => [
  {
    files: [`src/${layer}/**/*.ts`],
    rules: {
      'no-restricted-imports': restrictImports(...patterns, TESTING_IMPORTS),
      'no-restricted-syntax': ['error', NO_THROW],
    },
  },
  {
    files: [`src/${layer}/**/*.spec.ts`],
    rules: {
      'no-restricted-imports': restrictImports(...patterns),
    },
  },
];

export default tseslint.config(
  {
    ignores: [
      'eslint.config.mjs',
      'dist/**',
      'coverage/**',
      'src/infrastructure/persistence/generated/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-restricted-imports': restrictImports(TESTING_IMPORTS),
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
  {
    // Tests y utilidades de test: pueden importar @testing.
    files: TEST_FILES,
    rules: {
      'no-restricted-imports': restrictImports(),
    },
  },
  ...coreLayer('shared', [
    FRAMEWORK_IMPORTS,
    forbiddenLayers(['domain', 'application', 'infrastructure', 'config']),
  ]),
  ...coreLayer('domain', [
    FRAMEWORK_IMPORTS,
    forbiddenLayers(['application', 'infrastructure', 'config']),
  ]),
  ...coreLayer('application', [
    FRAMEWORK_IMPORTS,
    forbiddenLayers(['infrastructure', 'config']),
  ]),
  {
    // En los tests se permite lo necesario para montar mocks y fixtures.
    files: TEST_FILES,
    rules: {
      'no-restricted-syntax': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
);
