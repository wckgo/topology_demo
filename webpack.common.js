const path = require('path');
const copyWebpackPlugin = require('copy-webpack-plugin');
module.exports = {
  entry: ['babel-polyfill', './src/main.ts'],
  resolve: {
    extensions: ['.ts', '.js', '.json']
  },
  plugins: [
    new copyWebpackPlugin([{
      from: __dirname + '/src/public', //打包的静态资源目录地址
      to: './public' //打包到dist下面的public
    }])
  ]

};