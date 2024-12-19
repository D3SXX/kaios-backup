const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    fallback: {
      "stream": false
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules\/(?!(xml-js)\/).*/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "src/css", to: "src/css" },
        { from: "src/locale.json", to: "src/locale.json" },
        { from: "index.html", to: "index.html" },
        { from: "manifest.webapp", to: "manifest.webapp" },
        { from: "changelog.txt", to: "changelog.txt" },
        { from: "assets/icons/KaiOS-Backup_56.png", to: "assets/icons/KaiOS-Backup_56.png" },
        { from: "assets/icons/KaiOS-Backup_112.png", to: "assets/icons/KaiOS-Backup_112.png" },
      ],
    }),
  ],
};