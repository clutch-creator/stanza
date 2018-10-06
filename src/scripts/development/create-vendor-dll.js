import webpack from 'webpack';
import { resolve as pathResolve } from 'path';
import appRootDir from 'app-root-dir';
import md5 from 'md5';
import fs from 'fs-extra';

function createVendorDLL(bundleConfig) {
  const dllConfig = bundleConfig.devVendorDLL;

  // $FlowFixMe
  const pkg = require(pathResolve(appRootDir.get(), './package.json'));

  const devDLLDependencies = dllConfig.include
    .sort()
    .filter((elem, pos, arr) => arr.indexOf(elem) === pos);

  // We calculate a hash of the package.json's dependencies, which we can use
  // to determine if dependencies have changed since the last time we built
  // the vendor dll.
  const currentDependenciesHash = md5(
    JSON.stringify(
      devDLLDependencies.map((dep) => [
        dep,
        pkg.dependencies[dep],
        pkg.devDependencies[dep],
      ]),
    ),
  );

  const vendorDLLHashFolderPath = pathResolve(
    appRootDir.get(),
    bundleConfig.outputPath,
  );
  const vendorDLLHashFilePath = pathResolve(
    appRootDir.get(),
    bundleConfig.outputPath,
    `${dllConfig.name}_hash`,
  );

  function webpackConfigFactory() {
    return {
      // We only use this for development, so lets always include source maps.
      devtool: 'inline-source-map',
      entry: {
        [dllConfig.name]: devDLLDependencies,
      },
      node: {
        fs: 'empty',
        module: 'empty',
        child_process: 'empty',
      },
      output: {
        path: pathResolve(appRootDir.get(), bundleConfig.outputPath),
        filename: `${dllConfig.name}.js`,
        library: dllConfig.name,
      },
      plugins: [
        new webpack.DllPlugin({
          path: pathResolve(
            appRootDir.get(),
            bundleConfig.outputPath,
            `./${dllConfig.name}.json`,
          ),
          name: dllConfig.name,
        }),
      ],
    };
  }

  function buildVendorDLL() {
    return new Promise(async (resolve, reject) => {
      const webpackConfig = webpackConfigFactory();
      const vendorDLLCompiler = webpack(webpackConfig);

      vendorDLLCompiler.run((err, stats) => {
        if (err || stats.hasErrors()) {
          const info = stats.toJson();
          console.log(err);
          console.log(info.errors);
          reject(err);
          return;
        }

        // Update the dependency hash
        fs.ensureDir(vendorDLLHashFolderPath).then(() => {
          fs.writeFileSync(vendorDLLHashFilePath, currentDependenciesHash);

          resolve();
        });
      });
    });
  }

  return new Promise((resolve, reject) => {
    if (!fs.existsSync(vendorDLLHashFilePath)) {
      // builddll
      buildVendorDLL()
        .then(resolve)
        .catch(reject);
    } else {
      // first check if the md5 hashes match
      const dependenciesHash = fs.readFileSync(vendorDLLHashFilePath, 'utf8');
      const dependenciesChanged = dependenciesHash !== currentDependenciesHash;

      if (dependenciesChanged) {
        buildVendorDLL()
          .then(resolve)
          .catch(reject);
      } else {
        resolve();
      }
    }
  });
}

export default createVendorDLL;
