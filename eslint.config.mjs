// ts-check

import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import typescriptEslint from 'typescript-eslint';

export default [
  stylistic.configs['recommended-flat'],
  eslint.configs.recommended,
  ...typescriptEslint.configs.strictTypeChecked,
  ...typescriptEslint.configs.stylisticTypeChecked,
  eslintConfigPrettier,
  {
    plugins: {
      '@typescript-eslint': typescriptEslint.plugin,
      '@stylistic': stylistic,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parser: typescriptEslint.parser,
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.mjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },

    rules: {
      '@stylistic/linebreak-style': ['error', 'unix'],
      '@stylistic/quotes': [
        'error',
        'single',
        {
          allowTemplateLiterals: true,
        },
      ],
      '@stylistic/semi': ['error', 'always'],
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'prefer-const': 'error',
    },
  },
];
