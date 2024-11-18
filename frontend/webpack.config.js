const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv');

module.exports = () => {
  // Load environment variables based on mode
  const env = dotenv.config({ path: '.env.local' }).parsed || {};

  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.js',
      publicPath: '/ai-data-scientist',
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react']
            }
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader', 'postcss-loader']
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html'
      }),
      // Make environment variables available in your app
      new webpack.DefinePlugin({
        'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:8000')
      })
    ],
    devServer: {
      historyApiFallback: true,
      static: {
        directory: path.join(__dirname, 'public')
      },
      port: 3000,
      proxy: {
        '/api': {
          // Use environment variable for target if available
          target: env.VITE_API_URL || 'http://localhost:8000',
          pathRewrite: { '^/api': '' },
          changeOrigin: true
        }
      },
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
      }
    }
  };
};
