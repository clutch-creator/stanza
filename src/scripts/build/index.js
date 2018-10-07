// This script builds a production output of all of our bundles.
import webpack from 'webpack';
import appRootDir from 'app-root-dir';
import { resolve as pathResolve } from 'path';
import rimraf from 'rimraf';
import webpackConfigFactory from '../../webpack/configFactory';
import { exec } from '../../utils';
import config from '../../config';

process.env.NODE_ENV = 'production';

// First clear the build output dir.
rimraf.sync(pathResolve(appRootDir.get(), config.buildOutputPath));

const compilers = Object.keys(config.bundles).map((bundleName) => {
  const bundleConfig = config.bundles[bundleName];

  return webpack(
    webpackConfigFactory({
      target: bundleConfig.target,
      mode: 'production',
      bundleConfig,
    }),
  );
});

async function runCompilers() {
  for (let i = 0; i < compilers.length; i += 1) {
    await new Promise((accept) => {
      compilers[i].run((err, stats) => {
        if (err) {
          console.error(err);
          return;
        }

        // console.log(stats.toString({ colors: true }));
        console.log(`Done ${i + 1}/${compilers.length}`)
        accept();
      });
    });
  }
}

runCompilers();
