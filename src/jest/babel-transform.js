import babelJest from 'babel-jest';

module.exports = babelJest.createTransformer({
  presets: ['@babel/react', ['@babel/env', { modules: false }]],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    [
      '@babel/plugin-proposal-decorators',
      {
        decoratorsBeforeExport: true,
      },
    ],
    '@babel/plugin-proposal-export-default-from',
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-syntax-import-meta',
    '@babel/plugin-transform-modules-commonjs',
    '@babel/plugin-transform-react-jsx-self',
    '@babel/plugin-transform-react-jsx-source',
    '@babel/plugin-transform-runtime',
  ],
  babelrc: false,
});
