import type { Meta, StoryObj } from "@storybook/react"
import { StartIcon } from "../../../../src/components/detours/detourMap"

const meta = {
  component: StartIcon,
  render: StartIcon,
  parameters: {
    layout: "centered",
    stretch: false,
  },
} satisfies Meta<typeof StartIcon>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
