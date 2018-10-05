module.exports = {
  parser: 'babel-eslint',
  extends: ['airbnb', 'prettier'],
  env: {
    browser: true,
    es6: true,
    node: true,
    jest: true,
  },
  ecmaFeatures: {
    defaultParams: true,
  },
  rules: {
    'jsx-quotes': ['error', 'prefer-single'],
    // A .jsx extension is not required for files containing jsx.
    'react/jsx-filename-extension': 0,
    // allow _id underscore-dangle
    'no-underscore-dangle': [
      'error',
      {
        allowAfterThis: false,
        allow: ['_id'],
      },
    ],
    // enforcing stateless components also implies refactoring a
    // component entirely if we want to switch it to a non functional one
    // enforcing component structure consistency seems better at this point
    // -> also no performance gains for now (actually the opposite)
    'react/prefer-stateless-function': 0,
    // React sub renders should go below the main render
    // why? you read code from top to bottom
    'react/sort-comp': [
      'error',
      {
        order: [
          'static-methods',
          'lifecycle',
          '/^on.+$/',
          '/^(get|set)(?!(InitialState$|DefaultProps$|ChildContext$)).+$/',
          'everything-else',
          'render',
          '/^render.+$/',
        ],
      },
    ],
    // this was colliding with the sub render functions
    // can be set back when it supports regex entries in exceptMethods
    'class-methods-use-this': 0,
    // removed object prop type from forbidden since it leads to duplicate
    // object structure types declaration which can be hard to maintain in
    // the long term
    'react/forbid-prop-types': [
      'error',
      {
        forbid: ['any', 'array'],
      },
    ],
    // Sometimes mouse events are needed in other than buttons or links
    'jsx-a11y/no-static-element-interactions': 0,

    // in multiple cases you might want to break a single
    // parameter into a new line
    'function-paren-newline': 0,

    // this broke some use cases where you want the semicolon in a new line
    'semi-style': 0,

    // this is broken for template string
    indent: 0,

    // broken for re assignments, enable again after fix
    // https://github.com/eslint/eslint/issues/7886
    'prefer-destructuring': 0,

    // React router Link does not need/support href
    'jsx-a11y/anchor-is-valid': 0,

    // ignore this
    'jsx-a11y/click-events-have-key-events': 0,
    'jsx-a11y/mouse-events-have-key-events': 0,

    // temporary until refactor to not use findDOMNode
    'react/no-find-dom-node': 0,

    // htmlFor is enough
    'jsx-a11y/label-has-for': 0,

    // ignore
    'jsx-a11y/no-autofocus': 0,

    // ignore
    'jsx-a11y/no-noninteractive-element-interactions': 0,
    'react/no-will-update-set-state': 0,
    'jsx-a11y/media-has-caption': 0,
  },
  settings: {
    'import/resolver': {
      webpack: {
        config: {
          resolve: {
            extensions: ['.js', '.jsx'],
            modules: ['src', 'shared', 'node_modules'],
          },
        },
      },
    },
  },
};
