// Application Configuration.
//
// Please see the /docs/APPLICATION_CONFIG.md documentation for more info.
//
// Note: all file/folder paths should be relative to the project root. The
// absolute paths should be resolved during runtime by our build tools/server.

import fs from 'fs';
import path from 'path';
import appRootDir from 'app-root-dir';
import merge from 'deepmerge';
import { getStringEnvVar, getIntEnvVar } from './internals/environmentVars';
import filterObject from './internals/filterObject';

// This protects us from accidentally including this configuration in our
// client bundle. That would be a big NO NO to do. :)
if (process.env.IS_CLIENT) {
  throw new Error(
    "You shouldn't be importing the `./config` directly into your 'client' or 'shared' source as the configuration object will get included in your client bundle. Not a safe move! Instead, use the `safeConfigGet` helper function (located at `./src/shared/utils/config`) within the 'client' or 'shared' source files to reference configuration values in a safe manner.",
  );
}

// eslint-disable-next-line
let config = {
  // The host on which the server should run.
  host: getStringEnvVar('SERVER_HOST', 'localhost'),

  // The port on which the client bundle development server should run.
  clientDevServerPort: getIntEnvVar('CLIENT_DEVSERVER_PORT', 7331),

  // Path to the public assets that will be served off the root of the
  // HTTP server.
  publicAssetsPath: './public',

  // Where does our build output live?
  buildOutputPath: './build',

  // Should we optimize production builds (i.e. minify etc).
  // Sometimes you don't want this to happen to aid in debugging complex
  // problems.  Having this configuration flag here allows you to quickly
  // toggle the feature.
  optimizeProductionBuilds: true,

  // Do you want to included source maps (will be served as seperate files)
  // for production builds?
  includeSourceMapsForProductionBuilds: false,

  // These extensions are tried when resolving src files for our bundles..
  bundleSrcTypes: ['mjs', 'js', 'jsx', 'json'],

  // Additional asset types to be supported for our bundles.
  // i.e. you can import the following file types within your source and the
  // webpack bundling process will bundle them with your source and create
  // URLs for them that can be resolved at runtime.
  bundleAssetTypes: [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'ico',
    'eot',
    // 'svg',
    'ttf',
    'woff',
    'woff2',
    'otf',
  ],

  // What should we name the json output file that webpack generates
  // containing details of all output files for a bundle?
  bundleAssetsFileName: 'assets.json',

  // node_modules are not included in any bundles that target "node" as a runtime
  // (i.e. the server bundle).
  // The node_modules may however contain files that will need to be processed by
  // one of our webpack loaders.
  // Add any required file types to the list below.
  nodeBundlesIncludeNodeModuleFileTypes: [
    /\.(eot|woff|woff2|ttf|otf)$/,
    /\.(svg|png|jpg|jpeg|gif|ico)$/,
    /\.(mp4|mp3|ogg|swf|webp)$/,
    /\.(css|scss|sass|sss|less)$/,
  ],

  // We use the polyfill.io service which provides the polyfills that a
  // client needs, which is far more optimal than the large output
  // generated by babel-polyfill.
  // Note: we have to keep this seperate from our "htmlPage" configuration
  // as the polyfill needs to be loaded BEFORE any of our other javascript
  // gets parsed.
  polyfillIO: {
    enabled: true,
    url: 'https://cdn.polyfill.io/v2/polyfill.min.js',
  },

  bundles: {
    client: {
      target: 'client',

      // Src entry file.
      srcEntryFile: './src/client/index.js',

      // Src paths.
      srcPaths: ['./src/client', './src/shared', './config'],

      // Where does the client bundle output live?
      outputPath: './build/client',

      // What is the public http path at which we must serve the bundle from?
      webPath: '/',

      // Configuration settings for the development vendor DLL.  This will be created
      // by our development server and provides an improved dev experience
      // by decreasing the number of modules that webpack needs to process
      // for every rebuild of our client bundle.  It by default uses the
      // dependencies configured in package.json however you can customise
      // which of these dependencies are excluded, whilst also being able to
      // specify the inclusion of additional modules below.
      devVendorDLL: {
        // Enabled?
        enabled: false,

        // Specify any dependencies that you would like to include in the
        // Vendor DLL.
        //
        // NOTE: It is also possible that some modules require specific
        // webpack loaders in order to be processed (e.g. CSS/SASS etc).
        // For these cases you don't want to include them in the Vendor DLL.
        include: ['react', 'react-dom', 'react-helmet', 'react-router'],

        // The name of the vendor DLL.
        name: '__dev_vendor_dll__',
      },

      // Configuration for the HTML pages (headers/titles/scripts/css/etc).
      // We make use of react-helmet to consume the values below.
      // @see https://github.com/nfl/react-helmet
      htmlPage: {
        htmlAttributes: { lang: 'en' },
        titleTemplate: 'Stanzarize - %s',
        defaultTitle: 'Stanzarize',
        meta: [],
        links: [
          // When building a progressive web application you need to supply
          // a manifest.json as well as a variety of icon types. This can be
          // tricky. Luckily there is a service to help you with this.
          // http://realfavicongenerator.net/
        ],
        scripts: [
          // Example:
          // { src: 'http://include.com/pathtojs.js', type: 'text/javascript' },
        ],
      },
    },
    server: {
      target: 'server',
      autoStart: true,

      // Src entry file.
      srcEntryFile: './src/server/index.js',

      // Src paths.
      srcPaths: ['./src/server', './src/shared', './config'],

      // Where does the server bundle output live?
      outputPath: './build/server',
    },
  },

  // These plugin definitions provide you with advanced hooks into customising
  // the project without having to reach into the internals of the tools.
  //
  // We have decided to create this plugin approach so that you can come to
  // a centralised configuration folder to do most of your application
  // configuration adjustments.  Additionally it helps to make merging
  // from the origin starter kit a bit easier.
  plugins: {
    envConfig: (envVars) => envVars,

    // This plugin allows you to provide final adjustments your babel
    // configurations for each bundle before they get processed.
    //
    // This function will be called once for each for your bundles.  It will be
    // provided the current webpack config, as well as the buildOptions which
    // detail which bundle and mode is being targetted for the current function run.
    babelConfig: (babelConfig, buildOptions) => {
      // eslint-disable-next-line no-unused-vars
      const { target, mode } = buildOptions;

      // Example
      /*
      if (target === 'server' && mode === 'development') {
        babelConfig.presets.push('foo');
      }
     */

      return babelConfig;
    },

    // This plugin allows you to provide final adjustments your webpack
    // configurations for each bundle before they get processed.
    //
    // I would recommend looking at the "webpack-merge" module to help you with
    // merging modifications to each config.
    //
    // This function will be called once for each for your bundles.  It will be
    // provided the current webpack config, as well as the buildOptions which
    // detail which bundle and mode is being targetted for the current function run.
    webpackConfig: (webpackConfig, buildOptions) => {
      // eslint-disable-next-line no-unused-vars
      const { target, mode } = buildOptions;

      // Example:
      /*
      if (target === 'server' && mode === 'development') {
        webpackConfig.plugins.push(new MyCoolWebpackPlugin());
      }
      */

      // Debugging/Logging Example:
      /*
      if (target === 'server') {
        console.log(JSON.stringify(webpackConfig, null, 4));
      }
      */

      return webpackConfig;
    },
  },
};

const confPath = path.resolve(appRootDir.get(), 'stanza', 'index.js');
if (fs.existsSync(confPath)) {
  const conf = require(confPath);
  config = merge(config, conf);
}

// Export the client configuration object.
export const clientConfig = filterObject(
  // We will filter our full application configuration object...
  config,
  // using the rules below in order to create our filtered client configuration
  // object.
  //
  // This object will be bound to the window.__CLIENT_CONFIG__
  // property which is where client code should be referencing it from.
  // As we generally have shared code between our node/browser code we have
  // created a helper function in "./src/shared/utils/config" that you can used
  // to request config values from.  It will make sure that either the
  // application config file is used (i.e. this file), or the
  // window.__CLIENT_CONFIG__ is used.  This avoids boilerplate throughout your
  // shared code.  We recommend using this helper anytime you need a config
  // value within either the "client" or "shared" folder (i.e. any folders
  // that contain code which will end up in the browser).
  //
  // This is a filter that will be applied to our configuration in order to
  // determine which of our configuration values will be provided to the client
  // bundle.
  //
  // For security reasons you wouldn't want to make all of the configuration values
  // accessible by client bundles as these values would essentially be getting
  // transported over the wire to user's browsers.  There are however cases
  // where you may want to expose one or two of the values within a client bundle.
  //
  // This filter object must match the shape of the configuration object, however
  // you need not specify every property that is defined within the configuration
  // object.  Simply define the properties you would like to be included in the
  // client config, supplying a truthy value to them in order to ensure they
  // get included in the client bundle.
  {},
);

// Export the main config as the default export.
export default config;
