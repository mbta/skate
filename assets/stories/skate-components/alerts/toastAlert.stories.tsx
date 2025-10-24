import type { Meta, StoryObj } from "@storybook/react"
import ToastAlert from "../../../src/components/alerts/toastAlert"

const meta = {
  component: ToastAlert,
} satisfies Meta<typeof ToastAlert>

export default meta
type Story = StoryObj<typeof ToastAlert>

export const Default: Story = {
  args: { children: "Some text" },
}

export const Success: Story = {
  args: { children: "Success!", variant: "success" },
}
