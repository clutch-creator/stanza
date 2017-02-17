# Stanza

Stanza is not just a starter kit but a plug and play set of tools to build, test
and enforce good standards for your React and Node applications.

The problem with starter kits is that you don't get, at least easily, to take
advantage of future updates to the starter kit.

This projects is meant to be a config less approach.

## How to use

In your application repo, just install `stanzarize` as a dev dependency, make
sure you have at least npm 3.

__npm__

```bash
npm i --save-dev stanzarize
```

__yarn__

```bash
yarn add --dev stanzarize
```

That's it! You can now use the stanzarize scripts inside your package.json
scripts.

Available scripts are:

- `stanzarize development` - starts your node server and react application with
hot reloading.
- `stanzarize test` - runs your unit tests using jest with coverage.
- `stanzarize test-watch` - runs your unit tests using jest in watch mode with coverage.
- `stanzarize lint` - runs eslint to lint your project.
- `stanzarize lint-fix` - runs eslint in fix mode.
- `stanzarize build` - builds your node server and react application in
production mode.
- `stanzarize clean` - cleans the build folder.
