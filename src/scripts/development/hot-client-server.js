import express from 'express';
import createWebpackMiddleware from 'webpack-dev-middleware';
import createWebpackHotMiddleware from 'webpack-hot-middleware';
import historyApiFallback from 'connect-history-api-fallback';
import appRootDir from 'app-root-dir';
import path from 'path';
import ListenerManager from './listener-manager';
import { log } from '../../utils';
import config from '../../config';

export default class HotClientServer {
  constructor(bundle) {
    this.name = bundle.name.toUpperCase();
    this.bundle = bundle;

    if (bundle.bundleConfig.webPath) {
      this.serveStrategy();
    } else {
      this.buildOnlyStrategy();
    }

    this.commonStrategy();
  }

  commonStrategy() {
    const { compiler } = this.bundle;
    let initial = true;

    compiler.hooks.compile.tap('Stanza', () => {
      if (!initial) {
        log({
          title: `[${this.name}]`,
          level: 'info',
          message: 'Building new bundle...',
        });
      }
    });

    compiler.hooks.done.tap('Stanza', (stats) => {
      if (stats.hasErrors()) {
        log({
          title: `[${this.name}]`,
          level: 'error',
          message:
            'Build failed, please check the console for more information.',
          notify: true,
        });
        console.error(stats.toString());
      } else {
        log({
          title: `[${this.name}]`,
          level: 'info',
          message: '✨  Successfuly rebuilt.',
          notify: true,
        });
      }

      initial = false;
    });
  }

  serveStrategy() {
    const { compiler, bundleConfig } = this.bundle;
    const app = express();
    let initial = true;

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
    app.use(
      createWebpackHotMiddleware(compiler, {
        log: false,
      }),
    );

    // Configure serving dll
    app.use(
      bundleConfig.webPath,
      express.static(path.resolve(appRootDir.get(), bundleConfig.outputPath)),
    );

    // Configure serving static files
    app.use(
      express.static(path.resolve(appRootDir.get(), config.publicAssetsPath)),
    );

    // Fallback
    app.use(historyApiFallback());
    app.use(this.webpackDevMiddleware);

    const listener = app.listen(port, host, (err) => {
      if (err) {
        log({
          title: `[${this.name}]`,
          level: 'error',
          message: 'Error starting client server',
        });
      }
    });

    this.listenerManager = new ListenerManager(listener, 'client');

    compiler.hooks.done.tap('Stanza', () => {
      if (initial) {
        log({
          title: `[${this.name}]`,
          level: 'info',
          message: `Client served at http://${host}:${port}`,
        });
      }

      initial = false;
    });
  }

  buildOnlyStrategy() {
    const { compiler } = this.bundle;

    compiler.watch(
      {
        ignored: /node_modules/,
      },
      () => undefined,
    );
  }

  dispose() {
    if (this.webpackDevMiddleware) {
      this.webpackDevMiddleware.close();
    }

    return this.listenerManager
      ? this.listenerManager.dispose()
      : Promise.resolve();
  }
}
