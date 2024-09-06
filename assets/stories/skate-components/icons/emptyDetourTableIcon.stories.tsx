import type { Meta, StoryObj } from "@storybook/react"
import { EmptyDetourTableIcon } from "../../../src/components/detoursTable"

const meta = {
  component: EmptyDetourTableIcon,
  parameters: {
    layout: "centered",
    stretch: false,
  },
} satisfies Meta<typeof EmptyDetourTableIcon>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
