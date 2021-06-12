const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const projectWebpackConfig = (srcPath, servePath) => {
  const chunkName = `mlphotobooth`

  const entry = {}
  entry[chunkName] = {
    import: [
      path.resolve(srcPath, 'mlphotobooth.js'),
      path.resolve(srcPath, 'mlphotobooth.scss'),
    ],
  }

  const plugins = [
    new HtmlWebpackPlugin({
      filename: servePath ? path.join(servePath, 'index.html') : 'index.html',
      template: path.join(srcPath, 'index.hbs'),
      chunks: [chunkName]
    }),
  ]

  return {
    entry,
    plugins
  }
}

module.exports = {
  createConfig: projectWebpackConfig
}