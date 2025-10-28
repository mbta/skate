import type { Meta, StoryObj } from "@storybook/react"
import DismissableAlert from "../../../src/components/alerts/dismissableAlert"

const meta = {
  component: DismissableAlert,
} satisfies Meta<typeof DismissableAlert>

export default meta
type Story = StoryObj<typeof DismissableAlert>

export const Default: Story = {
  args: { children: "Some text" },
}
