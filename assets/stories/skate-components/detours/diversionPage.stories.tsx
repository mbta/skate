import type { Meta, StoryObj } from "@storybook/react"
import { DiversionPage } from "../../../src/components/detours/diversionPage"
import DiversionPanelMeta, {
  WithDirections as DiversionPanelWithDirections,
  WithStops as DiversionPanelWithStops,
} from "./diversionPanel.stories"
import { route39shape } from "../__story-data__/shape"

const meta = {
  component: DiversionPage,
  parameters: {
    layout: "fullscreen",
    stretch: true,
  },
  args: {
    // Provide default route settings
    ...DiversionPanelMeta.args,
    shape: route39shape,
  },
  argTypes: {
    ...DiversionPanelMeta.argTypes,
  },
} satisfies Meta<typeof DiversionPage>
export default meta

type Story = StoryObj<typeof meta>

export const WithoutDirections: Story = {}

export const WithDirections: Story = {
  args: {
    ...DiversionPanelWithDirections.args,
  },
}

export const WithStops: Story = {
  args: {
    ...DiversionPanelWithStops.args,
  },
}
