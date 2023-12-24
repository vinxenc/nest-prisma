module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'prettier',
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'import/prefer-default-export': 'off',
    'object-curly-newline': 'off',
    'linebreak-style': 'off',
    'import/no-cycle': 'off',
    'arrow-body-style': 'off',
    '@typescript-eslint/no-useless-constructor': 'off',
    '@typescript-eslint/indent': ['off'],
    'class-methods-use-this': ['off'],
    '@typescript-eslint/explicit-function-return-type': [
      'error',
      {
        'allowExpressions': true,
        'allowDirectConstAssertionInArrowFunctions': true,
        'allowConciseArrowFunctionExpressionsStartingWithVoid': true
      }
    ],
    'max-classes-per-file': 'off',
    'operator-linebreak': 'off',
    'implicit-arrow-linebreak': 'off',
    'newline-per-chained-call': 'off',
    'no-param-reassign': 0,
    'consistent-return': 'off'
  },
};
