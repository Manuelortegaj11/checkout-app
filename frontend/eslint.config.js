import eslint from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const forbiddenLayers = (layers) => ({
  regex: `(^@|/)(${layers.join('|')})(/|$)`,
  message:
    'Regla de dependencias: app → features → shared (y store). shared no importa features, store ni app.',
});

const FEATURE_INTERNALS = {
  regex: '^@features/[^/]+/',
  message:
    'Importa otra feature desde su API pública (@features/<feature>), no sus archivos internos.',
};

const API_FROM_VIEW = {
  regex: '(^@shared|/shared)/api(/|$)',
  allowTypeImports: true,
  message:
    'Los componentes no llaman a la API: despachan un thunk y leen el resultado con un selector.',
};

const LONG_RELATIVE_IMPORT = {
  regex: '^\\.\\./\\.\\./',
  message:
    'Usa los alias (@app, @features, @shared, @store, @testing) en lugar de subir más de un nivel.',
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

const IMPORT_META_ENV = {
  selector: "MemberExpression[object.type='MetaProperty'][property.name='env']",
  message:
    'Las variables VITE_* solo se leen en shared/config/env.ts (Jest lo sustituye por uno de prueba).',
};

const DANGEROUS_HTML = {
  selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
  message: 'Nunca dangerouslySetInnerHTML: React ya escapa el contenido.',
};

const CARD_DATA_IN_STATE = {
  selector:
    ':matches(Property, PropertyDefinition, TSPropertySignature)[key.name=/^(cardNumber|cvc|cvv)$/i]',
  message:
    'El número de tarjeta y el CVC nunca entran al store ni a localStorage: solo token, marca y últimos 4 dígitos.',
};

const FETCH = {
  name: 'fetch',
  message:
    'Solo shared/api/http-client.ts usa fetch: añade un servicio en shared/api.',
};

const BROWSER_STORAGE = ['localStorage', 'sessionStorage'].map((name) => ({
  name,
  message:
    'El estado se persiste solo con redux-persist (store/), así nada sensible acaba en el navegador por descuido.',
}));

export default tseslint.config(
  {
    ignores: ['dist/**', 'coverage/**', 'eslint.config.js'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,
  jsxA11y.flatConfigs.recommended,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports':
        restrictImports(TESTING_IMPORTS),
      'no-restricted-syntax': ['error', IMPORT_META_ENV, DANGEROUS_HTML],
      'no-restricted-globals': ['error', FETCH, ...BROWSER_STORAGE],
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': restrictImports(
        TESTING_IMPORTS,
        forbiddenLayers(['features', 'store', 'app']),
      ),
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}', 'src/store/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': restrictImports(
        TESTING_IMPORTS,
        forbiddenLayers(['app']),
        FEATURE_INTERNALS,
      ),
    },
  },
  {
    files: ['src/features/*/components/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-restricted-imports': restrictImports(
        TESTING_IMPORTS,
        forbiddenLayers(['app']),
        FEATURE_INTERNALS,
        API_FROM_VIEW,
      ),
    },
  },
  {
    files: ['src/app/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': restrictImports(
        TESTING_IMPORTS,
        FEATURE_INTERNALS,
        API_FROM_VIEW,
      ),
    },
  },
  {
    files: ['src/store/**/*.ts', 'src/features/**/*.slice.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        IMPORT_META_ENV,
        DANGEROUS_HTML,
        CARD_DATA_IN_STATE,
      ],
    },
  },
  {
    files: ['src/shared/config/env.ts'],
    rules: {
      'no-restricted-syntax': ['error', DANGEROUS_HTML],
    },
  },
  {
    files: ['src/shared/api/http-client.ts'],
    rules: {
      'no-restricted-globals': ['error', ...BROWSER_STORAGE],
    },
  },
  {
    files: ['src/store/local-storage.ts'],
    rules: {
      'no-restricted-globals': ['error', FETCH],
    },
  },
  {
    files: ['tests/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.jest } },
    rules: {
      '@typescript-eslint/no-restricted-imports': restrictImports(),
      '@typescript-eslint/unbound-method': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['*.config.ts'],
    languageOptions: { globals: globals.node },
  },
);
