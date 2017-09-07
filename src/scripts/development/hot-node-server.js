import path from 'path';
import appRootDir from 'app-root-dir';
import { spawn } from 'child_process';
import { log } from '../../utils';

class HotNodeServer {
  constructor(bundle, clientCompiler) {
    const { bundleConfig } = bundle;

    this.clientCompiler = clientCompiler;
    this.bundle = bundle;

    if (bundleConfig.autoStart) {
      this.autoStartStrategy();
    } else {
      this.buildOnlyStrategy();
    }
  }

  commonStrategy() {
    const { name, compiler } = this.bundle;
    let initial = true;

    compiler.plugin('compile', () => {
      this.serverCompiling = true;

      if (!initial) {
        log({
          title: name,
          level: 'info',
          message: 'Building new bundle...',
        });
      }
    });

    compiler.plugin('done', (stats) => {
      this.serverCompiling = false;

      if (this.disposing) {
        return;
      }

      if (stats.hasErrors()) {
        log({
          title: name,
          level: 'error',
          message: 'Build failed, check the console for more information.',
          notify: true,
        });
        console.log(stats.toString());
        return;
      }

      initial = false;
    });
  }

  startServer() {
    const { name, compiler } = this.bundle;

    const compiledEntryFile = path.resolve(
      appRootDir.get(),
      compiler.options.output.path,
      `${Object.keys(compiler.options.entry)[0]}.js`,
    );

    if (this.server) {
      this.server.kill();
      this.server = null;
      log({
        title: name,
        level: 'info',
        message: 'Restarting server...',
      });
    }

    const newServer = spawn('node', [compiledEntryFile]);

    log({
      title: `[${name}]`,
      level: 'info',
      message: '✨  Running with latest changes.',
      notify: true,
    });

    newServer.stdout.on('data', data => log({
      title: `[${name}]`,
      level: 'info',
      message: data.toString().trim(),
    }));

    newServer.stderr.on('data', (data) => {
      log({
        title: `[${name}]`,
        level: 'error',
        message: 'Error in server execution, check the console for more info.',
      });
      console.error(data.toString().trim());
    });

    this.server = newServer;
  }

  waitForClientThenStartServer() {
    if (this.serverCompiling) {
      // A new server bundle is building, break this loop.
      return;
    }

    if (this.clientCompiling) {
      setTimeout(this.waitForClientThenStartServer, 50);
    } else {
      this.startServer();
    }
  }

  autoStartStrategy() {
    const { name, compiler } = this.bundle;

    if (this.clientCompiler) {
      this.clientCompiler.plugin('compile', () => {
        this.clientCompiling = true;
      });

      this.clientCompiler.plugin('done', (stats) => {
        if (!stats.hasErrors()) {
          this.clientCompiling = false;
        }
      });
    }

    compiler.plugin('done', (stats) => {
      if (!stats.hasErrors()) {
        try {
          this.waitForClientThenStartServer();
        } catch (err) {
          log({
            title: name,
            level: 'error',
            message: 'Failed to start, please check the console for more information.',
            notify: true,
          });
          console.error(err);
        }
      }
    });

    // Lets start the compiler.
    this.watcher = compiler.watch(null, () => undefined);
  }

  buildOnlyStrategy() {
    const { compiler } = this.bundle;

    // Lets start the compiler.
    this.watcher = compiler.watch(null, () => undefined);
  }

  dispose() {
    this.disposing = true;

    const stopWatcher = new Promise((resolve) => {
      this.watcher.close(resolve);
    });

    return stopWatcher.then(() => { if (this.server) this.server.kill(); });
  }
}

export default HotNodeServer;
