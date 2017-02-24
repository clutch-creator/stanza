import ESDoc from 'esdoc';
import publisher from 'esdoc/out/src/Publisher/publish';
import appRootDir from 'app-root-dir';
import path from 'path';
import fs from 'fs';

const rootPath = appRootDir.get();
const source = path.resolve(rootPath, 'src');
const destination = path.resolve(rootPath, 'doc');

const manualPath = path.resolve(rootPath, 'manual');
const manual = {};

function parseManualsDir(basePath) {
  const result = [];
  const files = fs.readdirSync(basePath);

  files.forEach((filename) => {
    const filePath = path.resolve(basePath, filename);
    const stats = fs.lstatSync(filePath);

    if (stats.isFile()) {
      result.push(filePath);
    }
  });

  return result;
}

if (fs.existsSync(manualPath)) {
  const files = fs.readdirSync(manualPath);

  files.forEach((filename) => {
    const filePath = path.resolve(manualPath, filename);
    const stats = fs.lstatSync(filePath);

    if (stats.isDirectory()) {
      manual[filename] = parseManualsDir(filePath);
    } else if (stats.isFile()) {
      const parts = filename.split('.');
      manual[parts[0]] = [filePath];
    }
  });
}

const changelogPath = path.resolve(rootPath, 'CHANGELOG.md');
if (fs.existsSync(changelogPath)) {
  manual.changelog = [changelogPath];
}

console.log(manual);

const config = {
  source,
  destination,
  includes: ['\\.(js|jsx)$'],
  excludes: [
    '.*/__tests__/\\.js$',
    '.*/test/\\.js$',
  ],
  manual,
  experimentalProposal: {
    classProperties: true,
    objectRestSpread: true,
  },
};

ESDoc.generate(config, publisher);
