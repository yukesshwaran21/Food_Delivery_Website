
module.exports = {
  root: true,

  env: {
    browser: true,
    es2022: true,
    node: true,
  },

  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },

  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
  ],

  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],

  settings: {
    react: {
      version: 'detect',
    },
  },

  rules: {
    'no-debugger': 'error',
    'no-unreachable': 'error',
    'eqeqeq': ['error', 'always'],
    'prefer-const': 'error',
    'no-var': 'error',

    'no-unused-vars': ['error', {
      varsIgnorePattern: '^React$',
    }],
    'react/prop-types': 'off',
    'react/no-unescaped-entities': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'react/jsx-no-target-blank': 'off',
  },
};
