const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const { execSync } = require('child_process');

module.exports = (env = {}) => {
  // Get build type from environment or argument, defaults to 'dev'
  const BUILD_TYPE = env.BUILD_TYPE || process.env.BUILD_TYPE || 'dev';
  const packageJson = require('./package.json');
  const appVersion = process.env.APP_VERSION || packageJson.version;

  // Get git commit hash for dev builds
  let gitCommit = 'dev';
  if (BUILD_TYPE === 'dev') {
    try {
      gitCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim().toLowerCase();
    } catch (e) {
      // If git is not available, use 'dev'
      gitCommit = 'dev';
    }
  }

  const buildVersion = BUILD_TYPE === 'stable' 
    ? appVersion 
    : `${appVersion}-dev-${gitCommit}`;

  return {
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
  devtool: 'source-map',
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
    new webpack.DefinePlugin({
      '__APP_VERSION__': JSON.stringify(appVersion),
      '__BUILD_VERSION__': JSON.stringify(buildVersion),
      '__GIT_COMMIT__': JSON.stringify(gitCommit),
      '__BUILD_TYPE__': JSON.stringify(BUILD_TYPE),
    }),
  ],
  };
};