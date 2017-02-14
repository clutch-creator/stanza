import babelJest from 'babel-jest';

module.exports = babelJest.createTransformer({
  presets: [
    'react',
    ['es2015', { modules: false }],
    'stage-0',
  ],
  plugins: [
    'transform-runtime',
    'transform-es2015-modules-commonjs',
  ],
  babelrc: false,
});
