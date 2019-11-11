#!/usr/bin/env node
var program = require('commander');
var child_process = require('child_process');
var cmdValue;
var extraArgs = [];
var foundCmd = false;

program
  .version('0.0.1')
  .arguments('<cmd>')
  .action(function(cmd) {
    cmdValue = cmd;
  });

program.parse(process.argv);

program.rawArgs.forEach((element) => {
  if (element === cmdValue) {
    foundCmd = true;
    return;
  }
  if (foundCmd === true) {
    extraArgs.push(element);
  }
});

if (typeof cmdValue === 'undefined') {
  console.error('no command given!');
  process.exit(1);
}

switch (cmdValue) {
  case 'development':
    process.env.NODE_ENV = 'development';
    require('../dist/scripts/development');
    break;
  case 'test':
    require('../dist/scripts/test').default(extraArgs, false);
    break;
  case 'test-band':
    require('../dist/scripts/test').default(extraArgs, false, false, true);
    break;
  case 'test-band-no-coverage':
    require('../dist/scripts/test').default(extraArgs, false, true, true);
    break;
  case 'test-watch':
    require('../dist/scripts/test').default(extraArgs, true);
    break;
  case 'test-watch-no-coverage':
    require('../dist/scripts/test').default(extraArgs, true, true);
    break;
  case 'lint':
    require('../dist/scripts/lint').default();
    break;
  case 'lint-fix':
    require('../dist/scripts/lint').default(true);
    break;
  case 'analyze':
    require('../dist/scripts/analyze');
    break;
  case 'build':
    process.env.NODE_ENV = 'production';
    require('../dist/scripts/build');
    break;
  case 'clean':
    require('../dist/scripts/clean');
    break;
  case 'docs':
    require('../dist/scripts/docs');
    break;
  case 'preinstall':
    require('../dist/scripts/preinstall');
    break;
  default:
    console.error('Invalid command: ', cmdValue);
    process.exit(1);
}
