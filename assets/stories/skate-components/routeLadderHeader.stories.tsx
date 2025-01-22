import type { Meta, StoryObj } from "@storybook/react"

import { Header } from "../../src/components/routeLadder"

const meta = {
  component: Header,
  args: {
    routeName: "39",
    onClose: () => {},
    hasAlert: false,
    isAdmin: false,
  },
  argTypes: {
    onClose: { table: { disable: true } },
  },
} satisfies Meta<typeof Header>

export default meta
type Story = StoryObj<typeof Header>

export const Default: Story = {}
export const WithAlert: Story = {
  args: {
    hasAlert: true,
  },
}
export const AdminView: Story = {
  args: {
    isAdmin: true,
  },
}
export const AdminViewWithAlert: Story = {
  args: {
    hasAlert: true,
    isAdmin: true,
  },
}
