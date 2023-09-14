import { StorybookConfig } from "@storybook/react-webpack5"

const config: StorybookConfig = {
  stories: [
    {
      titlePrefix: "Skate",
      directory: "../stories/skate-components",
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
}
export default config
