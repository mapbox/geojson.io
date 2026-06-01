import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import unusedImports from 'eslint-plugin-unused-imports';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'dist/**',
      'build/**',
      'coverage/**',
      'node_modules/**',
      'workers/**',
      'vendor/**',
      'docs/**'
    ]
  },

  js.configs.recommended,

  ...tseslint.configs.recommended.map((cfg) => ({
    ...cfg,
    files: ['**/*.{ts,tsx}']
  })),

  // Base config for (JS/TS)
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021
      }
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      'unused-imports': unusedImports
    },
    settings: {
      react: { version: 'detect' }
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/display-name': 'off',
      'jsx-a11y/no-onchange': 'off',
      'jsx-a11y/no-autofocus': 'off',
      'no-warning-comments': ['error', { terms: ['fixme'] }],
      'no-restricted-imports': [
        'error',
        { paths: ['lodash', 'purify-ts', 'proj4'] }
      ],
      'no-throw-literal': 'error',
      'prefer-const': 'warn',
      'require-await': 'warn',
      'react/jsx-key': 'error',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'react/jsx-no-useless-fragment': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': [
        'warn',
        {
          additionalHooks: '(useRecoilCallback|useRecoilTransaction_UNSTABLE)'
        }
      ]
    }
  },

  // Type-aware rules ONLY for TS/TSX
  ...tseslint.configs.recommendedTypeChecked.map((cfg) => ({
    ...cfg,
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ...cfg.languageOptions,
      parserOptions: {
        ...cfg.languageOptions?.parserOptions,
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      ...cfg.rules,

      'prefer-const': 'warn',
      'unused-imports/no-unused-imports': 'error',

      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-base-to-string': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',

      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/switch-exhaustiveness-check': 'off',

      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-call': 'off',

      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unused-vars': 'off'
    }
  })),

  // CommonJS rules
  {
    files: ['*.config.js', '.eslintrc.js', '*.config.cjs', '.eslintrc.cjs'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.commonjs
      },
      sourceType: 'commonjs'
    }
  },

  // Prettier last (disables formatting rules that conflict with Prettier)
  prettier
];
