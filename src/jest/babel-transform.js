import babelJest from 'babel-jest';

module.exports = babelJest.createTransformer({
  presets: [
    'react',
    ['env', { modules: false }],
    'stage-0',
  ],
  plugins: [
    'transform-decorators-legacy',
    'transform-runtime',
    'transform-es2015-modules-commonjs',
  ],
  babelrc: false,
});
