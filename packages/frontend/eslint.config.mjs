import reactConfig from '@codygo-ai/eslint-config-react';
import tailwindCanonicalClasses from 'eslint-plugin-tailwind-canonical-classes';
import globals from 'globals';

export default [
  ...reactConfig,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        React: 'readonly',
        JSX: 'readonly',
      },
    },
    plugins: {
      'tailwind-canonical-classes': tailwindCanonicalClasses,
    },
    rules: {
      'tailwind-canonical-classes/tailwind-canonical-classes': [
        'error',
        { cssPath: './src/app/globals.css' },
      ],

      // SSV uses @ssv/* namespace, not @codygo-ai/*
      '@codygo-ai/mono/package-naming': 'off',

      // Gradual adoption: disable rules that need codebase-wide changes
      '@codygo-ai/mono/prefer-optional-chaining': 'off',
      '@codygo-ai/mono/prefer-minimal-checks': 'off',
      '@codygo-ai/mono/prefer-function-declaration': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-deprecated': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',

      // null is used throughout React/Firebase code (null !== undefined semantically)
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use string unions or as const instead of enums',
        },
        {
          selector: 'ExportNamedDeclaration[source=null] > ExportSpecifier',
          message: 'Use inline export declarations instead of separate export statements',
        },
      ],
    },
  },
  // TypeScript handles undefined variable checks
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-undef': 'off',
    },
  },
];
