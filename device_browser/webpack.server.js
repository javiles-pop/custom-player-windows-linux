const path = require('path');

module.exports = {
  target: 'node',
  mode: 'production',
  entry: './server.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'server.bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/preset-env', { targets: { node: '16' } }]]
          }
        }
      }
    ]
  },
  externals: {
    // Don't bundle native modules
  },
  node: {
    __dirname: false,
    __filename: false
  }
};
