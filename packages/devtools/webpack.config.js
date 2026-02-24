const path = require('path')

module.exports = {
  mode: 'production',
  entry: {
    devtools: './extension/devtools.js',
    background: './extension/background.js',
    content: './extension/content.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, 'tsconfig.extension.json')
          }
        },
        exclude: /node_modules/
      },
      {
        test: /\.jsx?$/,
        use: 'babel-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@gridkit/devtools-bridge': path.resolve(__dirname, 'bridge/'),
      '@gridkit/devtools-backend': path.resolve(__dirname, 'backend/')
    }
  },
  optimization: {
    minimize: true
  },
  devtool: 'source-map'
}
