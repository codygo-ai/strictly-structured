import baseConfig from '@codygo-ai/eslint-config-base';

export default [
  ...baseConfig,
  // Frontend uses ~/… path alias — tell import/order to treat it as internal
  {
    files: ['packages/frontend/**/*.{ts,tsx}'],
    rules: {
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [{ pattern: '~/**', group: 'internal' }],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },
  {
    rules: {
      // SSV uses @ssv/* namespace, not @codygo-ai/*
      '@codygo-ai/mono/package-naming': 'off',

      // Gradual adoption: disable rules that need codebase-wide changes
      // TODO: enable these incrementally in follow-up PRs
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

      // Override no-restricted-syntax to remove null and wildcard import restrictions
      // (null is a valid JSON Schema type used throughout validation code)
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
  // TypeScript handles undefined variable checks better than ESLint's no-undef
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-undef': 'off',
    },
  },
  // MCP server: @modelcontextprotocol/sdk requires .js extension in deep imports
  {
    files: ['packages/mcp-server/**/*.ts'],
    rules: {
      '@codygo-ai/mono/no-js-extension': 'off',
    },
  },
];
