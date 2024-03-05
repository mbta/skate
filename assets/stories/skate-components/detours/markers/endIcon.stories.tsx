import type { Meta, StoryObj } from "@storybook/react"
import { EndIcon } from "../../../../src/components/detours/detourMap"

const meta = {
  component: EndIcon,
  render: EndIcon,
  parameters: {
    layout: "centered",
    stretch: false,
  },
} satisfies Meta<typeof EndIcon>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
