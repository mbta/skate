import { Preview } from "@storybook/react"

import "../css/app.scss"
import "../css/storybook_app.scss"
import { stretchParameterDecorator } from "./stretchParameterDecorator"

const preview: Preview = {
  parameters: {
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
  tags: ["autodocs"]
}

export default preview
