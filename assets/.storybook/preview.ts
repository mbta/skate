import { Preview } from "@storybook/react"

import "../css/app.scss"
import "../css/StorybookApp.scss"
import { stretchParameterDecorator } from "./stretchParameterDecorator"

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /(timestamp|Date)$/,
      },
    },
    docs: {
      toc: {
        title: "Table of Contents",
      },
    },
  },
  decorators: [stretchParameterDecorator],
}

export default preview
