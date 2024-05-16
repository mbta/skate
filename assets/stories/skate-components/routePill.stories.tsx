import type { Meta, StoryObj } from "@storybook/react"

import { RoutePill } from "../../src/components/routePill"

const meta = {
  component: RoutePill,
} satisfies Meta<typeof RoutePill>

export default meta
type Story = StoryObj<typeof RoutePill>

export const Default: Story = {
  args: { routeName: "66" },
}

export const BlueLine: Story = {
  args: { routeName: "Blue Line" },
}

export const LargeFormat: Story = {
  args: { routeName: "66", className: "c-route-pill--large-format" },
}
