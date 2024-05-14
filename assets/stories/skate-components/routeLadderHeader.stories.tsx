import type { Meta, StoryObj } from "@storybook/react"

import { Header as RouteLadderHeader } from "../../src/components/routeLadder"
import routeFactory from "../../tests/factories/route"

const meta = {
  component: RouteLadderHeader,
  args: {
    route: routeFactory.build({ name: "39" }),
    deselectRoute: () => {},
    hasAlert: false,
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
