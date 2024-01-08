import type { Meta, StoryObj } from "@storybook/react"
import MapPage from "../../../src/components/mapPage"

const meta = {
  title: "pages/Map Page",
  component: MapPage,
  parameters: {
    layout: "fullscreen",
    stretch: true,
  },
} satisfies Meta<typeof MapPage>
export default meta

type Story = StoryObj<typeof meta>

export const Story: Story = {}
