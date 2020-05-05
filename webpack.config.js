const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');


// const CACHE_PATH = path.resolve(__dirname, './tmp/cache/webpack');

module.exports = {
  entry: './client/index.ts',
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
        test: /\.?ts$/,
        exclude: /(node_modules)/,
        use: 'ts-loader'
      },
    ],
  },
  devServer: {
    port: 3000,
    proxy: {
      '/socket.io/*': {
        target: 'http://localhost:8080',
      }
    },
    contentBase: path.resolve(__dirname, 'webpack'),
    hot: true,
    injectHot: true,
    inline: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      template: './client/html/index.html',
    })
  ],
  output: {
    filename: 'bundle.js',
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