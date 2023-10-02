import type { Meta, StoryObj } from "@storybook/react"
import React from "react"

import { inMapDecorator } from "../../../../.storybook/inMapDecorator"

import {
  UserLocationButton,
  UserLocationControl,
} from "../../../../src/components/map/controls/userLocationControl"

const meta = {
  component: UserLocationButton,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof UserLocationButton>

export default meta
type Story = StoryObj<typeof meta>

export const Enabled: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: "30px", height: "30px" }}>
        <Story />
      </div>
    ),
  ],
}

export const Disabled: Story = {
  decorators: Enabled.decorators,
  args: {
    disabled: true,
  },
}

export const InMap: Story = {
  parameters: {
    layout: "fullscreen",
    stretch: true,
  },
  decorators: [inMapDecorator],

  render: UserLocationControl,
}
