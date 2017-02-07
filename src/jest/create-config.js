import fs from 'fs';
import path from 'path';
import appRootDir from 'app-root-dir';

export default () => {
  const rootDir = appRootDir.get();
  const setupTestFilePath = path.resolve(rootDir, 'test', 'setup-test.js');
  const setupTestsFile = fs.existsSync(setupTestFilePath) ? '<rootDir>/src/setupTests.js' : undefined;

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
    moduleNameMapper: {
      '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/file-mock.js',
      '\\.(css|less)$': '<rootDir>/__mocks__/style-mock.js',
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
