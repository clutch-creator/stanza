import express from 'express';
import createWebpackMiddleware from 'webpack-dev-middleware';
import createWebpackHotMiddleware from 'webpack-hot-middleware';
import appRootDir from 'app-root-dir';
import path from 'path';
import ListenerManager from './listener-manager';
import { log } from '../../utils';
import config from '../../config';

class HotClientServer {
  constructor(compiler) {
    let initial = true;
    const app = express();

    const httpPathRegex = /^https?:\/\/(.*):([\d]{1,5})/i;
    const httpPath = compiler.options.output.publicPath;
    if (!httpPath.startsWith('http') && !httpPathRegex.test(httpPath)) {
      throw new Error(
        'You must supply an absolute public path to a development build of a web target bundle as it will be hosted on a seperate development server to any node target bundles.',
      );
    }

    // eslint-disable-next-line no-unused-vars
    const [_, host, port] = httpPathRegex.exec(httpPath);

    this.webpackDevMiddleware = createWebpackMiddleware(compiler, {
      quiet: true,
      noInfo: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      // Ensure that the public path is taken from the compiler webpack config
      // as it will have been created as an absolute path to avoid conflicts
      // with an node servers.
      publicPath: compiler.options.output.publicPath,
    });

    app.use(this.webpackDevMiddleware);
    app.use(createWebpackHotMiddleware(compiler, {
      log: false,
    }));

    // Configure serving of our client bundle.
    // app.use(config.bundles.client.webPath, clientBundle);

    // Configure static serving of our "public" root http path static files.
    // Note: these will be served off the root (i.e. '/') of our application.
    app.use(express.static(path.resolve(appRootDir.get(), config.publicAssetsPath)));

    const listener = app.listen(port, host, (err) => {
      if (err) {
        log({
          title: '[CLIENT]',
          level: 'error',
          message: 'Error starting client server',
        });
      }
    });

    this.listenerManager = new ListenerManager(listener, 'client');

    compiler.plugin('compile', () => {
      if (!initial) {
        log({
          title: '[CLIENT]',
          level: 'info',
          message: 'Building new bundle...',
        });
      }
    });

    compiler.plugin('done', (stats) => {
      if (stats.hasErrors()) {
        log({
          title: '[CLIENT]',
          level: 'error',
          message: 'Build failed, please check the console for more information.',
          notify: true,
        });
        console.error(stats.toString());
      } else {
        log({
          title: '[CLIENT]',
          level: 'info',
          message: '✨  Running with latest changes.',
          notify: true,
        });
      }

      if (initial) {
        log({
          title: '[CLIENT]',
          level: 'info',
          message: `Client served at http://${host}:${port}`,
        });
      }

      initial = false;
    });
  }

  dispose() {
    this.webpackDevMiddleware.close();

    return this.listenerManager
      ? this.listenerManager.dispose()
      : Promise.resolve();
  }
}

export default HotClientServer;