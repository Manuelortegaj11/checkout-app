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
    'Usa los alias (@shared, @domain, @application, @infrastructure, @config) en lugar de subir más de un nivel.',
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

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist/**', 'coverage/**'],
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
      'no-restricted-imports': restrictImports(),
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
  {
    files: ['src/shared/**/*.ts'],
    rules: {
      'no-restricted-imports': restrictImports(
        FRAMEWORK_IMPORTS,
        forbiddenLayers(['domain', 'application', 'infrastructure', 'config']),
      ),
      'no-restricted-syntax': ['error', NO_THROW],
    },
  },
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': restrictImports(
        FRAMEWORK_IMPORTS,
        forbiddenLayers(['application', 'infrastructure', 'config']),
      ),
      'no-restricted-syntax': ['error', NO_THROW],
    },
  },
  {
    files: ['src/application/**/*.ts'],
    rules: {
      'no-restricted-imports': restrictImports(
        FRAMEWORK_IMPORTS,
        forbiddenLayers(['infrastructure', 'config']),
      ),
      'no-restricted-syntax': ['error', NO_THROW],
    },
  },
  {
    // En los tests se permite lo necesario para montar mocks y fixtures.
    files: ['src/**/*.spec.ts', 'test/**/*.ts'],
    rules: {
      'no-restricted-syntax': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
);
