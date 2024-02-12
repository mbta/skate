import type { Meta, StoryObj } from "@storybook/react"
import React from "react"

import { CircleButton } from "../../src/components/circleButton"
import { UserAvatar } from "../../src/components/userAvatar"

const meta = {
  component: CircleButton,
} satisfies Meta<typeof CircleButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { children: <UserAvatar userName="foo" /> },
}
