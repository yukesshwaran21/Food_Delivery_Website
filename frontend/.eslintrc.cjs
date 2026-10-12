module.exports = {
rules: {
  // ==========================================
  // 1. SYNTAX ERRORS AND INVALID CODE
  // ==========================================
  'no-unreachable': 'error',
  'no-dupe-keys': 'error',
  'no-duplicate-case': 'error',
  'no-unexpected-multiline': 'error',
  'valid-typeof': 'error',
  'no-unexpected-multiline': 'error',

  // ==========================================
  // 2. POTENTIAL BUGS
  // ==========================================
  'no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    },
  ],
  'no-constant-condition': 'error',
  'no-constant-binary-expression': 'error',
  'eqeqeq': ['error', 'always'],
  'no-implicit-coercion': 'error',
  'no-throw-literal': 'error',
  'no-debugger': 'error',
  'no-unsafe-optional-chaining': 'error',
  'no-promise-executor-return': 'error',
  'no-unmodified-loop-condition': 'error',

  // ==========================================
  // 3. CODE STYLE AND MAINTAINABILITY
  // ==========================================
  'prefer-const': 'error',
  'no-var': 'error',
  'curly': ['error', 'all'],
  'object-shorthand': ['error', 'always'],
  'prefer-template': 'error',
  'no-trailing-spaces': 'error',
  'eol-last': ['error', 'always'],
  'quotes': ['error', 'single', { avoidEscape: true }],
  'semi': ['error', 'always'],
  'comma-dangle': ['error', 'always-multiline'],
  'no-console': ['error', { allow: ['warn', 'error'] }],

  // ==========================================
  // EXISTING PROJECT RULES
  // ==========================================
  'react/jsx-no-target-blank': 'off',
  'react-refresh/only-export-components': [
    'warn',
    { allowConstantExport: true },
  ],
},
};