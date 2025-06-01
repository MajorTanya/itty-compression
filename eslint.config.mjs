// ts-check

import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import typescriptEslint from 'typescript-eslint';

export default [
  stylistic.configs.recommended,
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
          allowDefaultProject: ['eslint.config.mjs', 'rollup.config.mjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },

    rules: {
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/comma-dangle': ['error', 'only-multiline'],
      '@stylistic/linebreak-style': ['error', 'unix'],
      '@stylistic/quotes': [
        'error',
        'single',
        {
          allowTemplateLiterals: true,
          avoidEscape: true,
        },
      ],
      '@stylistic/semi': ['error', 'always'],
      'prefer-const': 'error',
    },
  },
];
