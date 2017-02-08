import fs from 'fs';
import path from 'path';
import appRootDir from 'app-root-dir';

export default () => {
  const rootDir = appRootDir.get();
  const setupTestFilePath = path.resolve(rootDir, 'stanza', 'setup-test.js');
  const setupTestsFile = fs.existsSync(setupTestFilePath) ? setupTestFilePath : undefined;

  return {
    rootDir,
    setupTestFrameworkScriptFile: setupTestsFile,
    testEnvironment: 'node',
    testURL: 'http://localhost',
    moduleFileExtensions: [
      'js',
      'jsx',
    ],
    moduleDirectories: [
      'src',
      'shared',
      'node_modules',
    ],
    transform: {
      '^.+\\.(js|jsx)$': path.resolve(__dirname, 'babel-transform.js'),
    },
    moduleNameMapper: {
      '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': path.resolve(__dirname, 'asset-mock.js'),
      '\\.(css|less)$': path.resolve(__dirname, 'style-mock.js'),
    },
    testPathIgnorePatterns: [
      '<rootDir>[/\\\\](build|docs|node_modules|scripts)[/\\\\]',
      '/_fixtures',
    ],
    collectCoverage: true,
    coverageReporters: [
      'json',
      'html',
      'text-summary',
    ],
    collectCoverageFrom: ['src/**/*.{js,jsx}'],
  };
};
