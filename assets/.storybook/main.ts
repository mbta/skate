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

  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-onboarding",
    "@storybook/addon-interactions",
    "@storybook/preset-scss",
  ],

  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },

  docs: {
    autodocs: true,
    defaultName: "Documentation",
  },

  webpackFinal(config, _) {
    config.module?.rules?.push({
      test: /\.svg$/,
      type: "asset/source",
    })
    config.module?.rules?.push({
      test: /\.tsx?$/,
      use: [
        {
          loader: require.resolve("ts-loader"),
          options: { transpileOnly: true },
        },
      ],
    })
    return config
  },

  typescript: {
    reactDocgen: "react-docgen-typescript",
  },
}
export default config
