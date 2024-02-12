import type { Meta, StoryObj } from "@storybook/react"
import React from "react"

import { CircleButton } from "../../src/components/circleButton"
import { UserAvatar } from "../../src/components/userAvatar"

const meta = {
  component: CircleButton,
} satisfies Meta<typeof CircleButton>

export default meta
type Story = StoryObj<typeof CircleButton>

export const Default: Story = {
  args: { isActive: false },
}

export const Active: Story = {
  args: { isActive: true },
}

export const WithAvatar: Story = {
  args: { isActive: false },
  render: (args) => (
    <CircleButton {...args}>
      <UserAvatar userName="fake@test.com" />
    </CircleButton>
  ),
}

export const WithAvatarActive: Story = {
  args: { isActive: true },
  render: (args) => (
    <CircleButton {...args}>
      <UserAvatar userName="fake@test.com" />
    </CircleButton>
  ),
}
