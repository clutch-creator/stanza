import { resolve as pathResolve } from 'path';
import webpack from 'webpack';
import appRootDir from 'app-root-dir';
import { log } from '../../utils';
import HotNodeServer from './hot-node-server';
import HotClientServer from './hot-client-server';
import createVendorDLL from './create-vendor-dll';
import webpackConfigFactory from '../../webpack/configFactory';
import config from '../../config';

const usesDevVendorDLL = bundleConfig =>
  bundleConfig.devVendorDLL != null && bundleConfig.devVendorDLL.enabled;

const NUM_INI_STEPS = usesDevVendorDLL(config.bundles.client) ? 4 : 3;

const initializeBundle = (name, bundleConfig) => {
  const webpackConfig = webpackConfigFactory({
    target: name,
    mode: 'development',
  });

  // Install the vendor DLL config for the client bundle if required.
  if (name === 'client' && usesDevVendorDLL(bundleConfig)) {
    // Install the vendor DLL plugin.
    webpackConfig.plugins.push(
      new webpack.DllReferencePlugin({
        // $FlowFixMe
        manifest: require(
          pathResolve(
            appRootDir.get(),
            bundleConfig.outputPath,
            `${bundleConfig.devVendorDLL.name}.json`,
          ),
        ),
      }),
    );
  }

  return {
    name,
    bundleConfig,
    compiler: webpack(webpackConfig),
  };
};

class HotDevelopment {
  constructor() {
    let step = 1;

    this.hotClientServer = null;
    this.hotNodeServers = [];

    let clientBundle;
    let nodeBundles;

    Promise.resolve()
      .then(() => {
        let result = true;

        if (usesDevVendorDLL(config.bundles.client)) {
          log({
            title: `[${step}/${NUM_INI_STEPS}]`,
            message: '📦  Creating vendor DLLs...',
          });
          step += 1;

          result = createVendorDLL('client', config.bundles.client);
        }

        return result;
      })
      .catch((err) => {
        log({
          level: 'error',
          message: 'Unfortunately an error occured whilst trying to build the vendor dll(s) used by the development server. Please check the console for more information.',
          notify: true,
        });

        if (err) {
          console.error(err);
        }
      })
      .then(() => {
        log({
          title: `[${step}/${NUM_INI_STEPS}]`,
          message: '🔍  Calculating client compiler...',
        });
        step += 1;

        return initializeBundle('client', config.bundles.client);
      })
      .catch((err) => {
        log({
          level: 'error',
          message: 'Client webpack config is invalid, please check the console for more information.',
          notify: true,
        });
        console.error(err);
      })
      .then((bundle) => {
        clientBundle = bundle;

        log({
          title: `[${step}/${NUM_INI_STEPS}]`,
          message: '🔍  Calculating server compiler...',
        });
        step += 1;

        return Promise.all([initializeBundle('server', config.bundles.server)]
          .concat(Object.keys(config.additionalNodeBundles).map(name =>
            initializeBundle(name, config.additionalNodeBundles[name]),
          )),
        );
      })
      .catch((err) => {
        log({
          level: 'error',
          message: 'Server webpack config is invalid, please check the console for more information.',
          notify: true,
        });
        console.error(err);
      })
      .then((bundles) => {
        nodeBundles = bundles;
        log({
          title: `[${step}/${NUM_INI_STEPS}]`,
          message: '⌛  Building client and server bundles...',
        });

        this.hotClientServer = new HotClientServer(clientBundle.compiler);
        this.hotNodeServers = nodeBundles
          .map(({ name, compiler }) =>
            new HotNodeServer(name, compiler, clientBundle.compiler),
          );
      });
  }

  dispose() {
    const safeDisposer = server =>
      (server ? server.dispose() : Promise.resolve());

    // First the hot client server.
    return safeDisposer(this.hotClientServer)
      // Then dispose the hot node server(s).
      .then(() => Promise.all(this.hotNodeServers.map(safeDisposer)));
  }
}

export default HotDevelopment;
