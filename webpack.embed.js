const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const webpackConfig = (srcPath, templatePath, htmlOutputPath) => {
  const chunkName = 'mlphotobooth'

  const entry = {}
  entry[chunkName] = {
    import: [
      path.resolve(srcPath, `${chunkName}.js`),
      path.resolve(srcPath, `${chunkName}.scss`),
    ],
  }

  const plugins = [
    new HtmlWebpackPlugin({
      filename: htmlOutputPath || 'index.html',
      template: templatePath || path.join(srcPath, 'index.hbs'),
      chunks: [chunkName]
    }),
  ]

  const resolve = {
    alias: {
      threeExamples: path.resolve(__dirname, 'node_modules/three/examples/jsm/'),
    }
  }

  return {
    entry,
    plugins,
    resolve
  }
}

module.exports = {
  webpackConfig
}