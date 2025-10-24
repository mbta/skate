import type { Meta, StoryObj } from "@storybook/react"
import BaseAlert from "../../../src/components/alerts/baseAlert"

const variants = ["primary", "secondary", "success", "danger", "warning"]

const meta = {
  component: BaseAlert,
  argTypes: {
    variant: {
      options: variants,
      control: { type: "radio" },
    },
  },
} satisfies Meta<typeof BaseAlert>

export default meta
type Story = StoryObj<typeof BaseAlert>

export const Default: Story = {
  args: { children: "Some text", variant: "primary" },
}
