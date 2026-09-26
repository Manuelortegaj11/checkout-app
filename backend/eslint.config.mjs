// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Frameworks e infraestructura que el núcleo (domain + application) no puede conocer.
const FRAMEWORK_IMPORTS = {
  group: [
    '@nestjs/*',
    '@prisma/*',
    'class-validator',
    'class-transformer',
    'express',
  ],
  message:
    'El núcleo no depende de frameworks ni de infraestructura (arquitectura hexagonal).',
};

const layerImports = (layers) => ({
  group: layers.map((layer) => `**/${layer}/**`),
  message: 'Regla de dependencias: infrastructure → application → domain → shared.',
});

// ROP: los errores de negocio viajan como err(...), no como excepciones.
const NO_THROW = {
  selector: 'ThrowStatement',
  message: 'Devuelve err(...) en lugar de lanzar (Railway Oriented Programming).',
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
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
  {
    files: ['src/shared/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            FRAMEWORK_IMPORTS,
            layerImports(['domain', 'application', 'infrastructure']),
          ],
        },
      ],
      'no-restricted-syntax': ['error', NO_THROW],
    },
  },
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            FRAMEWORK_IMPORTS,
            layerImports(['application', 'infrastructure']),
          ],
        },
      ],
      'no-restricted-syntax': ['error', NO_THROW],
    },
  },
  {
    files: ['src/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [FRAMEWORK_IMPORTS, layerImports(['infrastructure'])],
        },
      ],
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
