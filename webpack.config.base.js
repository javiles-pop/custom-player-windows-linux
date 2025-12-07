const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const path = require('path');
const { cwd } = require('process');
require('dotenv').config();

// Base configuration for all packages. Options can be overridden from the device_*** folder's webpack configuration.

let config = {
  entry: ['react-hot-loader/patch', './src/index.tsx'],
  output: {
    path: path.resolve(cwd(), './dist'),
    chunkFilename: 'js/[name].js',
    filename: 'js/[name].js',
  },
  plugins: [
    // use index.html from core/public as template
    new HtmlWebpackPlugin({
      appMountId: 'root',
      filename: 'index.html',
      template: '../core/public/index.html',
    }),
    // inject env vars. DEVICE_TYPE variable is defined in the device-specific config.
    new webpack.EnvironmentPlugin({
      REACT_APP_ENVIRONMENT: process.env.ENVIRONMENT,
      REACT_APP_CLOUD_ENV: process.env.CLOUD_ENV,
      REACT_APP_VERSION: process.env.VERSION,
      REACT_APP_BUILD: process.env.BUILD_NUMBER,
      REACT_APP_BRIGHTSIGN_IP: process.env.BRIGHTSIGN_IP || '',
      REACT_APP_BRIGHTSIGN_SERIAL: process.env.BRIGHTSIGN_SERIAL || '',
    }),
  ],
  module: {
    rules: [
      // Typescript & React
      {
        test: /\.tsx?$/,
        use: ['ts-loader'],
        exclude: /[\\/]node_modules[\\/](?!(is-online|public-ip)[\\/])/,
      },
      // JS & JSX
      {
        test: /\.js$/,
        include: [
          path.resolve(__dirname, './node_modules/is-online'),
          path.resolve(__dirname, './node_modules/public-ip'),
        ],
        exclude: /[\\/]node_modules[\\/](?!(is-online|public-ip)[\\/])/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              babelrc: false,
            },
          },
        ],
      },
      // SCSS & CSS
      {
        test: /\.s?css$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      // SVG Assets
      {
        test: /\.svg$/,
        loader: 'file-loader',
        options: {
          outputPath: 'assets',
        }
      },
      // Fonts
      {
        test: /\.ttf$/,
        loader: 'file-loader',
        options: {
          outputPath: 'assets',
        }
      },
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
      },
    ],
  },
  resolve: {
    // Let TS handle the monorepo module resolution (tsconfig.paths)
    extensions: ['.tsx', '.ts', '.js', '.mjs', '.graphql'],
    alias: { react: require.resolve('react'), 'react-dom': require.resolve('react-dom') },
    plugins: [
      new TsconfigPathsPlugin({
        configFile: './tsconfig.json',
        logLevel: 'info',
        logInfoToStdOut: true,
        extensions: ['.ts', '.tsx'],
      }),
    ],
  },
  stats: {
    warningsFilter: [
      (warning) => {
        return !!warning.match(/(webpack performance recommendations|244 KiB)/);
      },
    ],
  },
  optimization: {
    usedExports: true,
    splitChunks: {
      chunks: 'all',
      name: true,
      cacheGroups: {
        default: false,
        vendor: {
          reuseExistingChunk: true,
          name: 'vendor',
          chunks: 'all',
          test: /[\\/]node_modules[\\/]/,
          enforce: true,
        },
      },
    },
  },
};

module.exports = config;
