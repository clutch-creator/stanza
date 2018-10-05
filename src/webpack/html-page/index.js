import serialize from 'serialize-javascript';

// html attributes deserialization
const htmlAttributes = (attrs) =>
  attrs
    ? Object.keys(attrs)
        .map((attrName) => `${attrName}="${attrs[attrName]}"`)
        .join(' ')
    : '';

// tags array deserialization
const insertTags = (tags) =>
  tags
    ? tags
        .map(
          (tag) =>
            `<${tag.tag} ${htmlAttributes(tag.attributes)}>${
              tag.tag !== 'meta' && tag.tag !== 'link'
                ? `${tag.content}</${tag.tag}>`
                : ''
            }`,
        )
        .join(' ')
    : '';

// script tag deserialization from url
const scriptTag = (url) =>
  `<script type="text/javascript" src="${url}"></script>`;

export default function generate(templateParams) {
  const {
    config,
    bundleConfig,
    clientConfig,
  } = templateParams.htmlWebpackPlugin.options.custom;
  const { htmlPage, webPath, devVendorDLL } = bundleConfig;

  return `
    <!DOCTYPE html>
    <html ${htmlAttributes(htmlPage.htmlAttributes)}>
      <head>
        <title>${htmlPage.defaultTitle}</title>
        <meta charset="utf-8" >
        ${insertTags(htmlPage.header)}
      </head>
      <body>
        <div id='root'></div>
        <script type="text/javascript" nonce="NONCE_TARGET">
          ${
            // Binds the client configuration object to the window object so
            // that we can safely expose some configuration values to the
            // client bundle that gets executed in the browser.
            `window.__CLIENT_CONFIG__=${serialize(clientConfig)};`
          }
        </script>
        ${
          // Enable the polyfill io script?
          // This can't be configured within a react-helmet component as we
          // may need the polyfill's before our client bundle gets parsed.
          config.polyfillIO.enabled ? scriptTag(config.polyfillIO.url) : ''
        }
        ${
          // When we are in development mode our development server will generate a
          // vendor DLL in order to dramatically reduce our compilation times.  Therefore
          // we need to inject the path to the vendor dll bundle below.
          // @see /tools/development/ensureVendorDLLExists.js
          process.env.NODE_ENV === 'development' &&
          devVendorDLL &&
          devVendorDLL.enabled
            ? scriptTag(`${webPath}${devVendorDLL.name}.js`)
            : ''
        }
        ${insertTags(htmlPage.footer)}
      </body>
    </html>`;
}
