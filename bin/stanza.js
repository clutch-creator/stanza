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

function runDevelopment () {
  require('../build/development');
}

switch (cmdValue) {
  case 'development':
    require('../build/development');
    break;
  case 'analyze':
    require('../build/scripts/analyze');
    break;
  case 'build':
    require('../build/scripts/build');
    break;
  case 'clean':
    require('../build/scripts/clean');
    break;
  case 'deploy':
    require('../build/scripts/deploy');
    break;
  case 'preinstall':
    require('../build/scripts/preinstall');
    break;
  default:
    console.error('Invalid command: ', cmdValue);
    process.exit(1);
}
