import type { Meta, StoryObj } from "@storybook/react"
import React from "react"

import {
  UserLocationButton,
  UserLocationControl,
} from "../../../../src/components/map/controls/userLocationControl"
import Map from "../../../../src/components/map"

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
  decorators: [
    (Story) => (
      <Map vehicles={[]}>
        <Story />
      </Map>
    ),
  ],

  render: UserLocationControl,
}
