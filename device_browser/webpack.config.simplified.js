const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
let config = require('../webpack.config.base');

const deviceSDKs = [
  `<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/0.4.1/html2canvas.min.js"></script>`,
  `<script>window.ISBSLocalFilePresent = () => {}</script>`,
  `<script src="injectChannelURL.js"></script>`,
].join('\n  ');

// Simplified webpack config - uses CSS to hide unwanted features
config = {
  ...config,
  entry: ['./src/index.tsx', './src/simplified.css'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
  },
  plugins: [
    ...config.plugins,
    new webpack.NormalModuleReplacementPlugin(
      /ShimMenuPageDeployment\.tsx$/,
      path.resolve(__dirname, 'src/SimplifiedShimMenuPageDeployment.tsx')
    ),
    new CopyWebpackPlugin({
      patterns: [{ from: 'src/injectChannelURL.js', to: 'injectChannelURL.js' }]
    }),
    new webpack.EnvironmentPlugin({
      REACT_APP_ENVIRONMENT: process.env.ENVIRONMENT,
      REACT_APP_CLOUD_ENV: process.env.CLOUD_ENV,
      REACT_APP_VERSION: process.env.VERSION,
      REACT_APP_BUILD: process.env.BUILD_NUMBER,
      DEVICE_TYPE: 'Browser',
      REACT_APP_SERIAL: process.env.SERIAL,
      REACT_APP_BRIGHTSIGN_IP: '',
      REACT_APP_BRIGHTSIGN_SERIAL: '',
    }),
    new HtmlWebpackPlugin({
      appMountId: 'root',
      filename: 'index.html',
      template: '../core/public/index.html',
      deviceSDKs,
    }),
  ],
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    port: 2999,
  },
  devtool: process.env.NODE_ENV === 'development' ? 'source-map' : 'none',
};

module.exports = config;
