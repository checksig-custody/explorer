import { fileURLToPath } from 'node:url';

import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(
  {
    // Build output, generated declarations and the vendored widget bundle.
    // None of them is ours to fix.
    ignores: [
      'dist/',
      'node_modules/',
      'auto-imports.d.ts',
      'components.d.ts',
      'public/vendor/',
    ],
  },
  {
    linterOptions: { reportUnusedDisableDirectives: 'error' },
  },
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  ...pluginVue.configs['flat/recommended'],
  {
    languageOptions: {
      globals: { ...globals.browser },
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        projectService: {
          // Root config files and tests sit outside the app project and are
          // checked with the Node one.
          allowDefaultProject: [
            'vite.config.ts',
            'eslint.config.mjs',
            'postcss.config.js',
            'tailwind.config.ts',
            'tests/*.test.ts',
            'daisyui-themes.d.ts',
          ],
          defaultProject: 'tsconfig.config.json',
        },
        tsconfigRootDir: rootDir,
        extraFileExtensions: ['.vue'],
      },
    },
    plugins: { '@eslint-community/eslint-comments': eslintComments },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': true,
          'ts-nocheck': true,
          'ts-check': false,
          'ts-expect-error': 'allow-with-description',
          minimumDescriptionLength: 10,
        },
      ],
      '@eslint-community/eslint-comments/require-description': 'error',
      '@eslint-community/eslint-comments/no-unlimited-disable': 'error',
      '@eslint-community/eslint-comments/disable-enable-pair': 'error',
    },
  },
  {
    // `||` and `??` differ for '', 0 and false. The rule stays on for
    // objects; it is off for primitives because the swap changes behaviour.
    rules: {
      '@typescript-eslint/prefer-nullish-coalescing': [
        'error',
        {
          ignorePrimitives: {
            string: true,
            number: true,
            boolean: true,
            bigint: true,
          },
        },
      ],
    },
  },
  {
    // Template layout is Prettier's job; these rules would fight it.
    files: ['**/*.vue'],
    rules: {
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/html-indent': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/mustache-interpolation-spacing': 'off',
      'vue/no-multi-spaces': 'off',
    },
  },
  {
    // File-based routing and layouts fix these file names (index.vue,
    // [address].vue, default.vue): they cannot be multi-word.
    files: [
      'src/modules/**/*.vue',
      'src/pages/**/*.vue',
      'src/layouts/*.vue',
    ],
    rules: { 'vue/multi-word-component-names': 'off' },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: { parser: tseslint.parser },
    },
  },
  {
    // The route file name [code_id] fixes the prop name, which cannot be camelCase.
    files: ['src/modules/**/*_id*/*.vue', 'src/modules/**/*_id*.vue'],
    rules: { 'vue/prop-name-casing': 'off' },
  },
  {
    // node:test registers a test when test() is called; the promise it returns
    // settles when the run ends and is not meant to be awaited.
    files: ['tests/**/*.ts'],
    rules: { '@typescript-eslint/no-floating-promises': 'off' },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: { globals: { ...globals.node } },
  }
);
