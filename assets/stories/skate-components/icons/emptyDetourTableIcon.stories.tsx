import type { Meta, StoryObj } from "@storybook/react"
import { EmptyDetourTableIcon } from "../../../src/helpers/skateIcons"

const meta = {
  component: EmptyDetourTableIcon,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof EmptyDetourTableIcon>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
