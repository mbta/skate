import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { UserLocationCircle } from "../../../../src/components/map/markers/userLocationMarker"

const meta = {
  component: UserLocationCircle,
  decorators: [
    (Story) => (
      <div
        className="c-user-location-marker"
        style={{ width: "10px", height: "10px", margin: "32px" }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    radius: 25,
    heading: 45,
  },
} satisfies Meta<typeof UserLocationCircle>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
