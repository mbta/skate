import type { Meta, StoryObj } from "@storybook/react"
import { WaypointIcon } from "../../../../src/components/detours/detourMap"

const meta = {
  component: WaypointIcon,
  render: WaypointIcon,
  parameters: {
    layout: "centered",
    stretch: false,
  },
} satisfies Meta<typeof WaypointIcon>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
