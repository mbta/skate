import type { Meta, StoryObj } from "@storybook/react"

import { Header as RouteLadderHeader } from "../../src/components/routeLadder"

const meta = {
  component: RouteLadderHeader,
  args: {
    routeName: "39",
    onClose: () => {},
    hasAlert: false,
  },
  argTypes: {
    onClose: { table: { disable: true } },
  },
} satisfies Meta<typeof RouteLadderHeader>

export default meta
type Story = StoryObj<typeof RouteLadderHeader>

export const Default: Story = {}
export const WithAlert: Story = {
  args: {
    hasAlert: true,
  },
}
