import { resolve as pathResolve } from 'path';
import webpack from 'webpack';
import appRootDir from 'app-root-dir';
import { log } from '../../utils';
import webpackConfigFactory from '../../webpack/configFactory';
import config from '../../config';
import HotNodeServer from './hot-node-server';
import HotClientServer from './hot-client-server';
import createVendorDLL from './create-vendor-dll';

const bundlesNames = Object.keys(config.bundles);
const NUM_INI_STEPS = 3;

/**
 * Hot Development class starts and manages the entire build process
 */
export default class HotDevelopment {
  constructor() {
    this.hotClientServers = [];
    this.hotNodeServers = [];

    this.init();
  }

  async init() {
    // step 1 -> generate dlls
    await this.generateDlls();

    // step 2 -> generating bundles compilers
    const bundles = await this.generateCompilers();

    // step 3 -> building bundles
    this.build(bundles);
  }

  async generateDlls() {
    const promises = [];
    let result;

    log({
      title: `[1/${NUM_INI_STEPS}]`,
      message: '📦  Creating vendor DLLs...',
    });

    // check every bundle for dll configs
    bundlesNames.forEach((bundleName) => {
      const bundle = config.bundles[bundleName];

      if (bundle.devVendorDLL && bundle.devVendorDLL.enabled) {
        promises.push(
          createVendorDLL(bundle),
        );
      }
    });

    try {
      result = await Promise.all(promises);
    } catch (err) {
      log({
        level: 'error',
        message: 'Unfortunately an error occured whilst trying to build the vendor dll(s). Please check the console for more information.',
        notify: true,
      });

      if (err) {
        console.error(err);
      }
    }

    return result;
  }

  async generateCompilers() {
    const bundles = [];

    log({
      title: `[2/${NUM_INI_STEPS}]`,
      message: '🔍  Generating bundles compilers...',
    });

    bundlesNames.forEach((bundleName) => {
      const bundleConfig = config.bundles[bundleName];

      try {
        bundles.push(
          this.initializeBundle(bundleName, bundleConfig),
        );
      } catch (err) {
        log({
          level: 'error',
          message: 'Client webpack config is invalid, please check the console for more information.',
          notify: true,
        });
      }
    });

    return bundles;
  }

  build(bundles) {
    log({
      title: `[3/${NUM_INI_STEPS}]`,
      message: '⌛  Building bundles...',
    });

    bundles.forEach((bundle) => {
      const bundleConfig = config.bundles[bundle.name];

      if (bundleConfig.target === 'client') {
        this.hotClientServers.push(
          new HotClientServer(bundle),
        );
      } else if (bundleConfig.target === 'server') {
        this.hotNodeServers.push(
          new HotNodeServer(bundle),
        );
      }
    });
  }

  initializeBundle(name, bundleConfig) {
    const webpackConfig = webpackConfigFactory({
      target: bundleConfig.target,
      mode: 'development',
    });

    // Install the vendor DLL config if required.
    if (bundleConfig.devVendorDLL && bundleConfig.devVendorDLL.enabled) {
      webpackConfig.plugins.push(
        new webpack.DllReferencePlugin({
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
  }

  dispose() {
    const safeDisposer = server =>
      (server ? server.dispose() : Promise.resolve());

    // First the hot client server.
    return Promise.all(this.hotClientServers.map(safeDisposer))
      .then(() => Promise.all(this.hotNodeServers.map(safeDisposer)));
  }
}
