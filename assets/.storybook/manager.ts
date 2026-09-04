import { addons } from "@storybook/manager-api"
import { create } from "@storybook/theming/create"

const theme = create({
  base: "dark",
  brandTitle: "Skate",
})

addons.setConfig({
  theme,
  outline: true,
})
