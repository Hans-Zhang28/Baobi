const path = require('path');

module.exports = {
  entry: './client',
  mode: 'production',
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
      }
    ],
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'webpack'),
  },
};