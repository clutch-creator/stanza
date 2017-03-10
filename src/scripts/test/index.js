import jest from 'jest';
import createConfig from '../../jest/create-config';

export default (watch) => {
  process.env.NODE_ENV = 'test';

  const argv = [];

  // test
  if (watch) {
    argv.push('--watch');
    argv.push('--notify');
  } else {
    argv.push('--forceExit');
  }

  // add config
  argv.push('--config', JSON.stringify(createConfig()));

  jest.run(argv);
};
