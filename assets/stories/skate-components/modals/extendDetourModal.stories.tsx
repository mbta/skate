import type { Meta, StoryObj } from "@storybook/react"

import { ExtendDetourModal } from "../../../src/components/detours/extendDetourModal"

const meta = {
  component: ExtendDetourModal,
} satisfies Meta<typeof ExtendDetourModal>

export default meta
type Story = StoryObj<typeof ExtendDetourModal>

export const Default: Story = {
  args: {
    routeOrigin: "Nubian",
    routeName: "1",
    routeDescription: "Harvard",
    routeDirection: "Outbound",
  },
}
