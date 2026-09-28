import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const FRAMEWORK_IMPORTS = {
  regex: '^(@nestjs|@prisma)/|^(class-validator|class-transformer|express)$',
  message:
    'El núcleo no depende de frameworks ni de infraestructura (arquitectura hexagonal).',
};

const forbiddenLayers = (layers) => ({
  regex: `(^@|/)(${layers.join('|')})(/|$)`,
  message:
    'Regla de dependencias: infrastructure → application → domain → shared. La configuración solo la lee infrastructure.',
});

const LONG_RELATIVE_IMPORT = {
  regex: '^\\.\\./\\.\\./',
  message:
    'Usa los alias (@shared, @domain, @application, @infrastructure, @config, @testing) en lugar de subir más de un nivel.',
};

const TESTING_IMPORTS = {
  regex: '^@testing/|^(\\.\\./)+tests/',
  message:
    'El código de producción no importa nada de tests/ (@testing): solo las pruebas.',
};

const restrictImports = (...patterns) => [
  'error',
  { patterns: [...patterns, LONG_RELATIVE_IMPORT] },
];

const NO_THROW = {
  selector: 'ThrowStatement',
  message:
    'Devuelve err(...) en lugar de lanzar (Railway Oriented Programming).',
};

const IMPLICIT_NON_DETERMINISM = [
  {
    selector: "NewExpression[callee.name='Date'][arguments.length=0]",
    message: 'Pide la hora al ClockPort en lugar de usar new Date().',
  },
  {
    selector:
      "CallExpression[callee.object.name='Date'][callee.property.name='now']",
    message: 'Pide la hora al ClockPort en lugar de usar Date.now().',
  },
  {
    selector:
      "CallExpression[callee.object.name='Math'][callee.property.name='random']",
    message: 'Pide los identificadores al IdGeneratorPort en lugar de usar azar.',
  },
  {
    selector: "CallExpression[callee.name='randomUUID']",
    message: 'Pide los identificadores al IdGeneratorPort.',
  },
];

const TEST_FILES = ['tests/**/*.ts'];






const coreLayer = (layer, patterns) => [
  {
    files: [`src/${layer}/**/*.ts`],
    rules: {
      'no-restricted-imports': restrictImports(...patterns, TESTING_IMPORTS),
      'no-restricted-syntax': ['error', NO_THROW, ...IMPLICIT_NON_DETERMINISM],
    },
  },
  {
    files: [`tests/unit/${layer}/**/*.ts`],
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
    files: TEST_FILES,
    rules: {
      'no-restricted-syntax': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
);
