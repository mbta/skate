// This file has been automatically migrated to valid ESM format by Storybook.
import { createRequire } from "node:module";
import type { StorybookConfig } from "@storybook/react-webpack5"

const require = createRequire(import.meta.url);

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
    "@storybook/preset-scss",
    "@storybook/addon-docs"
  ],

  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },

  docs: {
    defaultName: "Documentation"
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
