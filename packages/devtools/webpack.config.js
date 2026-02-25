const path = require('path')
const fs = require('fs')
const CopyWebpackPlugin = require('copy-webpack-plugin')

// Ensure dist/extension directory exists
const distExtensionPath = path.resolve(__dirname, 'dist/extension')
if (!fs.existsSync(distExtensionPath)) {
  fs.mkdirSync(distExtensionPath, { recursive: true })
}

module.exports = {
  mode: 'production',
  entry: {
    background: './extension/background.js',
    content: './extension/content.js',
    'panel/index': './extension/panel/index.tsx'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    library: {
      type: 'var',
      name: 'GridKitDevTools'
    }
  },
  experiments: {
    outputModule: false
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
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
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
  devtool: 'source-map',
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'extension/*.html',
          to: '[name][ext]',
          context: path.resolve(__dirname)
        },
        {
          from: 'extension/icons',
          to: 'icons',
          context: path.resolve(__dirname)
        },
        {
          from: 'extension/manifest.json',
          to: 'manifest.json',
          context: path.resolve(__dirname)
        },
        {
          from: 'extension/panel/*.html',
          to: 'panel/[name][ext]',
          context: path.resolve(__dirname)
        },
        {
          from: 'extension/panel/styles/**/*',
          to: 'panel/styles/[name][ext]',
          context: path.resolve(__dirname)
        }
      ]
    })
  ]
}
