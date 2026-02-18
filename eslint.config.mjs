import path from 'node:path';

import baseConfig from '@codygo-ai/eslint-config-base';
import reactConfig from '@codygo-ai/eslint-config-react';
import tailwindCanonicalClasses from 'eslint-plugin-tailwind-canonical-classes';
import globals from 'globals';

const root = import.meta.dirname;

// React-specific configs (everything in reactConfig that isn't shared with base)
const reactOnlyConfigs = reactConfig.filter((cfg) => !baseConfig.includes(cfg));

export default [
  ...baseConfig,
  // React/JSX rules scoped to frontend
  ...reactOnlyConfigs.map((cfg) => ({
    ...cfg,
    files: ['packages/frontend/**/*.{tsx,jsx}'],
  })),
  // Frontend-specific: browser globals, tailwind, ~/… path alias
  {
    files: ['packages/frontend/**/*.{ts,tsx}'],
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
        { cssPath: path.join(root, 'packages/frontend/src/app/globals.css') },
      ],
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
  // Next.js pages/layouts must co-export metadata alongside the component
  {
    files: ['packages/frontend/**/page.tsx', 'packages/frontend/**/layout.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  // Dynamic inline styles are unavoidable for computed values (widths, colors)
  {
    files: ['packages/frontend/**/*.{ts,tsx}'],
    rules: {
      'react/forbid-dom-props': 'off',
    },
  },
  // Shared overrides for all packages
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
  // Skill package: plain ESM .mjs (no TypeScript project)
  {
    files: ['packages/skill/**/*.mjs'],
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
  },
];
