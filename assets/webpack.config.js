const path = require("path")
const glob = require("glob")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const TerserPlugin = require("terser-webpack-plugin")
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin")
const CopyWebpackPlugin = require("copy-webpack-plugin")

module.exports = (env, options) => {
  const plugins = [
    new MiniCssExtractPlugin({ filename: "../css/app.css" }),
    new CopyWebpackPlugin({ patterns: [{ from: "static/", to: "../" }] }),
  ]

  const useMinimization = options.mode === "production"

  return {
    optimization: {
      minimize: useMinimization,
      minimizer: [
        new TerserPlugin({ parallel: true }),
        new CssMinimizerPlugin(),
      ],
    },
    devtool: "source-map",
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
          type: "asset/source",
          use: [
            {
              loader: "svgo-loader",
              options: {
                plugins: [
                  {
                    name: "preset-default",
                    params: {
                      overrides: {
                        // viewBox is required to resize SVGs with CSS.
                        // @see https://github.com/svg/svgo/issues/1128
                        removeViewBox: false,
                      },
                    },
                  },
                  {
                    name: "removeTitle",
                    active: true,
                  },
                  {
                    name: "removeAttrs",
                    params: {
                      attrs: ["id"],
                    },
                  },
                ],
              },
            },
          ],
        },
        {
          test: /\.png$/,
          type: "asset/resource",
        },
      ],
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx"],
      modules: ["deps", "node_modules"],
    },
    plugins: plugins,
  }
}
