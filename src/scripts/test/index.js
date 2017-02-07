import jest from 'jest';
import createConfig from '../../jest/create-config';

export default (watch) => {
  const argv = [];

  // test
  if (watch) {
    argv.push('--watch');
    argv.push('--notify');
  }

  // add config
  argv.push('--config', JSON.stringify(createConfig()));

  jest.run(argv);
};
