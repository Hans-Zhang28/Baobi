const path = require('path');

module.exports = {
  entry: './client/index.js',
  mode: 'development',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'webpack'),
  },
};