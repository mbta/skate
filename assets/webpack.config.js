const path = require("path")
const glob = require("glob")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const TerserPlugin = require("terser-webpack-plugin")
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin")
const CopyWebpackPlugin = require("copy-webpack-plugin")

module.exports = (env, options) => ({
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({ parallel: true, sourceMap: true }),
      new OptimizeCSSAssetsPlugin({}),
    ],
  },
  devtool: 'source-map',
  entry: {
    "./js/app.tsx": ["./src/app.tsx"].concat(glob.sync("./vendor/**/*.js")),
  },
  output: {
    filename: "app.js",
    path: path.resolve(__dirname, "../priv/static/js"),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
      {
        test: /\.s?css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
          },
          {
            loader: "sass-loader",
          },
        ],
      },
      {
        test: /\.svg$/,
        use: [
          { loader: "svg-inline-loader" },
          {
            loader: "svgo-loader",
            options: {
              externalConfig: "svgo.yml",
            },
          },
        ],
      },
      {
        test: /\.png$/,
        use: [{ loader: "file-loader" }],
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    modules: ["deps", "node_modules"],
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: "../css/app.css" }),
    new CopyWebpackPlugin({ patterns: [{ from: "static/", to: "../" }] }),
  ],
})
