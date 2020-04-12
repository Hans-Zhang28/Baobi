const path = require('path');
const webpack = require('webpack');

const CACHE_PATH = path.resolve(__dirname, './tmp/cache/webpack');

module.exports = {
  entry: './client',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ]
      },
      {
       test: /\.(png|svg|jpg|gif)$/,
       use: [{
         loader: 'url-loader',
         options: {
           limit: 8000, // Convert images < 8 kb to base64 strings
           name: 'images/[name].[ext]'
         }
       }]
      },
      {
        test: /\.?tsx$/,
        exclude: /(node_modules)/,
        use: 'ts-loader'
      },
    ],
  },
  devServer: {
    contentBase: './webpack',
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'webpack'),
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  stats: {
    colors: true,
  },
  devtool: 'inline-source-map',
};