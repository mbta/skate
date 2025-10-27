import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import RoutingErrorAlert from "../../../../src/components/detours/alerts/routingErrorAlert"

const meta = {
  component: RoutingErrorAlert,
  argTypes: { children: { control: "text" } },
  decorators: [
    (Story) => (
      <div style={{ margin: "3em" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RoutingErrorAlert>

export default meta
type Story = StoryObj<typeof RoutingErrorAlert>

export const Default: Story = {
  args: { children: undefined },
}
