import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import DetourDrawingAlert from "../../../../src/components/detours/alerts/detourDrawingAlert"

const meta = {
  component: DetourDrawingAlert,
  decorators: [
    (Story) => (
      <div style={{ margin: "3em" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DetourDrawingAlert>

export default meta
type Story = StoryObj<typeof DetourDrawingAlert>

export const Default: Story = {
  args: { children: "Detour shape is not editable from this screen" },
}
