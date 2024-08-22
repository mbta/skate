import type { Meta, StoryObj } from "@storybook/react"

import { Header } from "../../src/components/routeLadder"

const meta = {
  component: Header,
  args: {
    routeName: "39",
    onClose: () => {},
    hasAlert: false,
    showDropdown: false,
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
export const WithDetourDropdown: Story = {
  args: {
    showDropdown: true,
  },
}
export const WithAlertAndDropdown: Story = {
  args: {
    hasAlert: true,
    showDropdown: true,
  },
}
