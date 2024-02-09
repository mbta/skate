import type { Meta, StoryObj } from "@storybook/react"
import React from "react"

import { UserAvatar } from "../../src/components/userAvatar"

const meta = {
  component: UserAvatar,
  decorators: [
    (Story) => (
      <div style={{ width: "2rem", height: "2rem" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof UserAvatar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { userName: "fake@test.com" } }
