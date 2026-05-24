import js from '@eslint/js';

// ESLint 配置
// ESLint configuration
export default [
  js.configs.recommended,
  {
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'js/'],
  },
];
