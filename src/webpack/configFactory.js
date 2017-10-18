import path from 'path';
import webpack from 'webpack';
import AssetsPlugin from 'assets-webpack-plugin';
import nodeExternals from 'webpack-node-externals';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import appRootDir from 'app-root-dir';
import WebpackMd5Hash from 'webpack-md5-hash';
import { removeEmpty, ifElse, merge, happyPackPlugin } from '../utils';
import config, { clientConfig } from '../config';

/**
 * This function is responsible for creating the webpack configuration for
 * all of our bundles.
 *
 * It has been configured to support one "client/web" bundle, and any number of
 * additional "node" bundles (i.e. our "server").  You can define additional
 * node bundles by editing the config/project.js file.
 *
 * This factory does not and will not support building multiple web target
 * bundles.  We expect there to be only one web client representing the full
 * server side rendered single page application.  Code splitting negates any
 * need for you to create multiple web bundles.  Therefore we are avoiding this
 * level of abstraction to keep the config factory as simple as possible.
 */
export default function webpackConfigFactory(buildOptions) {
  const { target, mode, bundleConfig } = buildOptions;

  // mode
  const isDev = mode === 'development';
  const isProd = mode === 'production';
  const ifDev = ifElse(isDev);
  const ifProd = ifElse(isProd);

  // target
  const isClient = target === 'client';
  const isNode = target === 'server';
  const ifClient = ifElse(isClient);
  const ifNode = ifElse(isNode);

  // Preconfigure some ifElse helper instnaces. See the util docs for more
  // information on how this util works.
  const ifDevClient = ifElse(isDev && isClient);
  const ifDevServeClient = ifElse(isDev && isClient && bundleConfig.webPath);
  const ifProdClient = ifElse(isProd && isClient);

  let clientEnvVariables = {
    'process.env.NODE_ENV': JSON.stringify(mode),
    'process.env.IS_CLIENT': JSON.stringify(isClient),
    'process.env.IS_SERVER': JSON.stringify(isNode),
    'process.env.IS_NODE': JSON.stringify(isNode),
  };

  clientEnvVariables = config.plugins.envConfig(clientEnvVariables);

  if (!bundleConfig) {
    throw new Error('No bundle configuration exists for target:', target);
  }

  const webpackConfig = {
    target: isClient
      // Only our client bundle will target the web as a runtime.
      ? 'web'
      // Any other bundle (including the server) will target node as a runtime.
      : 'node',

    // Ensure that webpack polyfills the following node features for use
    // within any bundles that are targetting node as a runtime. This will be
    // ignored otherwise.
    node: Object.assign({
      __dirname: true,
      __filename: true,
    }, bundleConfig.node),

    // We don't want our node_modules to be bundled with any bundle that is
    // targetting the node environment, prefering them to be resolved via
    // native node module system.
    // Therefore we use the `webpack-node-externals` library to help us generate
    // an  externals config that will ignore all node_modules.
    externals: removeEmpty([
      ifNode(
        () => nodeExternals(
          // Some of our node_modules may contain files that depend on webpack
          // loaders, e.g. CSS or SASS.
          // For these cases please make sure that the file extensions are
          // registered within the following configuration setting.
          { whitelist:
              // We always want the source-map-support excluded.
              ['source-map-support/register'].concat(
                // Then exclude any items specified in the config.
                config.nodeBundlesIncludeNodeModuleFileTypes || [],
              ),
          },
        ),
      ),
    ]),

    // Source map settings.
    devtool: ifElse(
        // Include source maps for ANY node bundle so that we can support
        // nice stack traces for errors (the source maps get consumed by
        // the `node-source-map-support` module to allow for this).
        isNode
        // Always include source maps for any development build.
        || isDev
        // Allow for the following flag to force source maps even for production
        // builds.
        || config.includeSourceMapsForProductionBuilds,
      )(
      // Produces an external source map (lives next to bundle output files).
      'source-map',
      // Produces no source map.
      'hidden-source-map',
    ),

    // Performance budget feature.
    // This enables checking of the output bundle size, which will result in
    // warnings/errors if the bundle sizes are too large.
    // We only want this enabled for our production client.  Please
    // see the webpack docs on how you can configure this to your own needs:
    // https://webpack.js.org/configuration/performance/
    performance: ifProdClient(
      // Enable webpack's performance hints for production client builds.
      { hints: 'warning' },
      // Else we have to set a value of "false" if we don't want the feature.
      false,
    ),

    // Define our entry chunks for our bundle.
    entry: {
      index: removeEmpty([
        // This grants us source map support, which combined with our webpack
        // source maps will give us nice stack traces for our node executed
        // bundles.
        ifNode('source-map-support/register'),
        // Required to support hot reloading of our client.
        ifDevServeClient('react-hot-loader/patch'),
        // Required to support hot reloading of our client.
        ifDevServeClient(() => `webpack-hot-middleware/client?reload=true&path=http://${config.host}:${config.clientDevServerPort}/__webpack_hmr`),
        // We are using polyfill.io instead of the very heavy babel-polyfill.
        // Therefore we need to add the regenerator-runtime as the babel-polyfill
        // included this, which polyfill.io doesn't include.
        ifClient('regenerator-runtime/runtime'),
        // The source entry file for the bundle.
        path.resolve(appRootDir.get(), bundleConfig.srcEntryFile),
      ]),
    },

    // Bundle output configuration.
    output: merge(
      {
        // The dir in which our bundle should be output.
        path: path.resolve(appRootDir.get(), bundleConfig.outputPath),
        // The filename format for our bundle's entries.
        filename: ifProdClient(
          // For our production client bundles we include a hash in the filename.
          // That way we won't hit any browser caching issues when our bundle
          // output changes.
          // Note: as we are using the WebpackMd5Hash plugin, the hashes will
          // only change when the file contents change. This means we can
          // set very aggressive caching strategies on our bundle output.
          '[name]-[chunkhash].js',
          // For any other bundle (typically a server/node) bundle we want a
          // determinable output name to allow for easier importing/execution
          // of the bundle by our scripts.
          '[name].js',
        ),
        // The name format for any additional chunks produced for the bundle.
        chunkFilename: '[name]-[chunkhash].js',
        // When in node mode we will output our bundle as a commonjs2 module.
        libraryTarget: ifNode('commonjs2', 'var'),
      },
      // This is the web path under which our webpack bundled client should
      // be considered as being served from.
      // We only need to set this for our server/client bundles as the server
      // bundle is the application that serves the client bundle.
      ifElse((isNode || isClient) && bundleConfig.webPath)(() => ({
        publicPath: ifDev(
          // As we run a seperate development server for our client and server
          // bundles we need to use an absolute http path for the public path.
          `http://${config.host}:${config.clientDevServerPort}${bundleConfig.webPath}`,
          // Otherwise we expect our bundled client to be served from this path.
          bundleConfig.webPath,
        ),
      })),
    ),

    resolve: {
      // These extensions are tried when resolving a file.
      extensions: config.bundleSrcTypes.map(ext => `.${ext}`),
      modules: [
        'src',
        'shared',
        'node_modules',
      ],
    },

    plugins: removeEmpty([
      // We use this so that our generated [chunkhash]'s are only different if
      // the content for our respective chunks have changed.  This optimises
      // our long term browser caching strategy for our client bundle, avoiding
      // cases where browsers end up having to download all the client chunks
      // even though 1 or 2 may have only changed.
      ifClient(() => new WebpackMd5Hash()),

      // The DefinePlugin is used by webpack to substitute any patterns that it
      // finds within the code with the respective value assigned below.
      new webpack.DefinePlugin(clientEnvVariables),

      // Generates a JSON file containing a map of all the output files for
      // our webpack bundle.  A necessisty for our server rendering process
      // as we need to interogate these files in order to know what JS/CSS
      // we need to inject into our HTML. We only need to know the assets for
      // our client bundle.
      ifClient(() =>
        new AssetsPlugin({
          filename: config.bundleAssetsFileName,
          path: path.resolve(appRootDir.get(), bundleConfig.outputPath),
        }),
      ),

      // We don't want webpack errors to occur during development as it will
      // kill our dev servers.
      ifDev(() => new webpack.NoEmitOnErrorsPlugin()),

      // We need this plugin to enable hot reloading of our client.
      ifDevServeClient(() => new webpack.HotModuleReplacementPlugin()),

      // For our production client we need to make sure we pass the required
      // configuration to ensure that the output is minimized/optimized.
      ifProdClient(
        () => new webpack.LoaderOptionsPlugin({
          minimize: config.optimizeProductionBuilds,
        }),
      ),

      // For our production client we need to make sure we pass the required
      // configuration to ensure that the output is minimized/optimized.
      ifProdClient(
        ifElse(config.optimizeProductionBuilds)(
          () => new webpack.optimize.UglifyJsPlugin({
            sourceMap: config.includeSourceMapsForProductionBuilds,
            compress: {
              screw_ie8: true,
              warnings: false,
            },
            mangle: {
              screw_ie8: true,
            },
            output: {
              comments: false,
              screw_ie8: true,
            },
          }),
        ),
      ),

      // For the production build of the client we need to extract the CSS into
      // CSS files.
      ifProdClient(
        () => new ExtractTextPlugin({
          filename: '[name]-[chunkhash].css', allChunks: true,
        }),
      ),

      // -----------------------------------------------------------------------
      // START: HAPPY PACK PLUGINS
      //
      // @see https://github.com/amireh/happypack/

      // HappyPack 'javascript' instance.
      happyPackPlugin({
        name: 'happypack-javascript',
        // We will use babel to do all our JS processing.
        loaders: [{
          path: 'babel-loader',
          // We will create a babel config and pass it through the plugin
          // defined in the project configuration, allowing additional
          // items to be added.
          query: config.plugins.babelConfig(
            // Our "standard" babel config.
            {
              // We need to ensure that we do this otherwise the babelrc will
              // get interpretted and for the current configuration this will mean
              // that it will kill our webpack treeshaking feature as the modules
              // transpilation has not been disabled within in.
              babelrc: false,

              presets: [
                'react',
                ['env', { targets: { node: isNode }, modules: false }],
                'stage-0',
              ].filter(x => x != null),

              plugins: [
                'transform-decorators-legacy',
                // Required to support react hot loader.
                ifDevServeClient('react-hot-loader/babel'),
                // This decorates our components with  __self prop to JSX elements,
                // which React will use to generate some runtime warnings.
                ifDev('transform-react-jsx-self'),
                // Adding this will give us the path to our components in the
                // react dev tools.
                ifDev('transform-react-jsx-source'),
              ].filter(x => x != null),
            },
            buildOptions,
          ),
        }],
      }),

      // HappyPack 'css' instance for development client.
      ifDevClient(
        () => happyPackPlugin({
          name: 'happypack-devclient-css',
          loaders: [
            'style-loader',
            {
              path: 'css-loader',
              // Include sourcemaps for dev experience++.
              query: {
                sourceMap: true,
                modules: true,
                importLoaders: 1,
                localIdentName: '[name]__[local]___[hash:base64:5]',
              },
            },
            'sass-loader',
          ],
        }),
      ),

      // END: HAPPY PACK PLUGINS
      // -----------------------------------------------------------------------

      // Client HTML
      ifElse(isClient && bundleConfig.htmlPage)(() => new HtmlWebpackPlugin({
        filename: 'index.html',
        template: path.resolve(__dirname, 'html-page'),
        minify: {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true,
        },
        inject: true,
        // We pass our config objects as values as they will be needed
        // by the template.
        custom: {
          config,
          bundleConfig,
          clientConfig,
        },
      })),
    ]),

    module: {
      rules: removeEmpty([
        // JAVASCRIPT
        {
          test: /\.jsx?$/,
          loader: 'happypack/loader?id=happypack-javascript',
          include: removeEmpty([
            ...bundleConfig.srcPaths.map(srcPath =>
              path.resolve(appRootDir.get(), srcPath),
            ),
          ]),
        },

        // CSS
        ifElse(isClient || isNode)(
          merge(
            {
              test: /\.(css|sass|scss)$/,
            },
            ifDevClient({
              loaders: ['happypack/loader?id=happypack-devclient-css'],
            }),
            ifProdClient(() => ({
              loader: ExtractTextPlugin.extract({
                fallback: 'style-loader',
                use: [
                  {
                    loader: 'css-loader',
                    options: {
                      sourceMap: false,
                      modules: true,
                      importLoaders: 1,
                      localIdentName: '[name]__[local]___[hash:base64:5]',
                    },
                  },
                  'sass-loader',
                ],
              }),
            })),
            ifNode({
              loaders: ['css-loader/locals'],
            }),
          ),
        ),

        // GraphQL
        {
          test: /\.(graphql|gql)$/,
          loaders: ['graphql-tag/loader'],
        },

        // ASSETS (Images/Fonts/etc)
        ifElse((isClient || isNode) && bundleConfig.webPath)(() => ({
          test: new RegExp(`\\.(${config.bundleAssetTypes.join('|')})$`, 'i'),
          loader: 'file-loader',
          query: {
            // What is the web path that the client bundle will be served from?
            // The same value has to be used for both the client and the
            // server bundles in order to ensure that SSR paths match the
            // paths used on the client.
            publicPath: isDev
              // When running in dev mode the client bundle runs on a
              // seperate port so we need to put an absolute path here.
              ? `http://${config.host}:${config.clientDevServerPort}${bundleConfig.webPath}`
              // Otherwise we just use the configured web path for the client.
              : bundleConfig.webPath,
            // We only emit files when building a web bundle, for the server
            // bundle we only care about the file loader being able to create
            // the correct asset URLs.
            emitFile: isClient,
          },
        })),
      ]),
    },
  };

  // Apply the configuration middleware.
  return config.plugins.webpackConfig(webpackConfig, buildOptions);
}
