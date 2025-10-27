import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import CopiedDetourToast from "../../../../src/components/detours/alerts/copiedDetourToast"

const meta = {
  component: CopiedDetourToast,
  decorators: [
    (Story) => (
      <div style={{ margin: "3em" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CopiedDetourToast>

export default meta
type Story = StoryObj<typeof CopiedDetourToast>

export const Default: Story = {
  args: { timeout: 15000 },
}
