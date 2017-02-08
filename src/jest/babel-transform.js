import babelJest from 'babel-jest';

module.exports = babelJest.createTransformer({
  presets: [
    'react',
    'es2015',
    'stage-0',
  ],
  plugins: ['transform-runtime'],
  babelrc: false,
});
