#!/usr/bin/env node
var program = require('commander');
var child_process = require('child_process');
var cmdValue;

program
  .version('0.0.1')
  .arguments('<cmd>')
  .action(function (cmd) {
    cmdValue = cmd;
  });

program.parse(process.argv);

if (typeof cmdValue === 'undefined') {
  console.error('no command given!');
  process.exit(1);
}

switch (cmdValue) {
  case 'development':
    require('../dist/development');
    break;
  case 'analyze':
    require('../dist/scripts/analyze');
    break;
  case 'build':
    require('../dist/scripts/build');
    break;
  case 'clean':
    require('../dist/scripts/clean');
    break;
  case 'preinstall':
    require('../dist/scripts/preinstall');
    break;
  default:
    console.error('Invalid command: ', cmdValue);
    process.exit(1);
}
