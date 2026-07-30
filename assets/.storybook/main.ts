import type { StorybookConfig } from "@storybook/react-webpack5"

const config: StorybookConfig = {
  stories: [
    {
      titlePrefix: "Skate",
      directory: "../stories/skate-components",
    },
    {
      titlePrefix: "Design System",
      directory: "../stories/skate-design",
    },
  ],

  addons: ["@storybook/addon-docs"],

  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },

  docs: {
    defaultName: "Documentation",
  },

  webpackFinal(config, _) {
    config.module?.rules?.push(
      {
        test: /\.svg$/,
        type: "asset/source",
      },
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "ts-loader",
            options: { transpileOnly: true },
          },
        ],
      },
      {
        test: /\.scss$/,
        use: ["style-loader", "css-loader", "sass-loader"],
      }
    )

    return config
  },

  typescript: {
    reactDocgen: "react-docgen-typescript",
  },
}
export default config
