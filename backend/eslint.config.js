import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js/src/index.js';
import prettierConfig from 'eslint-config-prettier';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a compatibility layer
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  js.configs.recommended,
  ...compat.extends('plugin:@typescript-eslint/recommended'),
  prettierConfig,
  {
    ignores: ['node_modules/**', 'dist/**'],
  },
];
