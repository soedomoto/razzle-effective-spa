const path = require("path");
const LoadableWebpackPlugin = require("@loadable/webpack-plugin");
const WorkboxWebpackPlugin = require("workbox-webpack-plugin");
const AppManifestWebpackPlugin = require('webpack-pwa-manifest')
const WebpackExternalCdnPlugin = require('./webpack-cdn-plugin');

module.exports = {
  options: {
    buildType: 'single-page-application',
  },
  modifyWebpackConfig(opts) {
    const config = opts.webpackConfig;

    if (opts.env.target === "web") {
      config.plugins.push(
        new LoadableWebpackPlugin({
          outputAsset: false,
          writeToDisk: { filename: path.resolve(__dirname, "build") },
        })
      );

      config.plugins.push(
        new WebpackExternalCdnPlugin({
          dev: opts.env.dev,
          modules: [
            {
              name: 'react',
              var: 'React',
              devUrl: 'https://unpkg.com/:name@:version/umd/react.development.js',
              prodUrl: 'https://unpkg.com/:name@:version/umd/react.production.min.js',
            },
            {
              name: 'react-dom',
              var: 'ReactDOM',
              devUrl: 'https://unpkg.com/:name@:version/umd/react-dom.development.js',
              prodUrl: 'https://unpkg.com/:name@:version/umd/react-dom.production.min.js',
            },
            {
              name: 'moment',
              var: 'moment',
              devUrl: 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/:version/moment-with-locales.min.js',
            }
          ],
        })
      );

      if (!opts.env.dev) {
        const { shortname = 'My Progressive Web App', longname = 'My Progressive Web App', description = 'My Progressive Web App' } = require(path.resolve(__dirname, 'package.json'));

        config.plugins.push(
          new WorkboxWebpackPlugin.GenerateSW({
            clientsClaim: true,
            skipWaiting: true
          }),
          new AppManifestWebpackPlugin({
            name: longname,
            short_name: shortname,
            description: description,
            background_color: '#ffffff',
            theme_color: '#ffffff',
            crossorigin: null,
            inject: true,
            ios: true,
            icons: [
              {
                src: path.resolve('public/bps.png'),
                sizes: [96, 128, 192, 256, 384, 512], // multiple sizes
                ios: true
              }
            ]
          })
        );
      }
    }

    return config;
  },
};
