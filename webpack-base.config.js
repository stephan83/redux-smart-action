/*eslint-disable */

var path = require('path');

var reduxExternal = {
  root: 'Redux',
  commonjs2: 'redux',
  commonjs: 'redux',
  amd: 'redux'
};

module.exports = {
  externals: {
    'redux': reduxExternal
  },
  module: {
    loaders: [
      {
        test: /\.js?$/,
        loader: 'babel?stage=0',
        include: path.join(__dirname, 'src')
      }
    ],
  },
  output: {
    library: 'ReactSmartAction',
    libraryTarget: 'umd'
  },
  resolve: {
    extensions: ['', '.js']
  }
};
