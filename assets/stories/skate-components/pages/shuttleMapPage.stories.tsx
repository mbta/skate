import type { Meta, StoryObj } from "@storybook/react"

import ShuttleMapPage from "../../../src/components/shuttleMapPage"

const meta = {
  title: "pages/Shuttle Map",
  component: ShuttleMapPage,
  parameters: {
    layout: "fullscreen",
    stretch: true,
  },
} satisfies Meta<typeof ShuttleMapPage>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}
