import { CLIEngine } from 'eslint';

export default (fix) => {
  const cli = new CLIEngine({
    useEslintrc: true,
    extensions: ['.js', '.jsx'],
    fix,
  });

  const report = cli.executeOnFiles(['src/']);
  const formatter = cli.getFormatter('codeframe');

  console.log(formatter(report.results));

  if (fix) {
    CLIEngine.outputFixes(report);
  } else if (report.errorCount) {
    process.exit(1); // exit with error
  }
};
