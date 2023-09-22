import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { UserLocationCircle } from "../../../../src/components/map/markers/userLocationMarker"

const meta = {
  component: UserLocationCircle,
  parameters: {
    layout: "centered",
  },
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
} satisfies Meta<typeof UserLocationCircle>

export default meta
type Story = StoryObj<typeof meta>

export const AccuracyAndHeading: Story = {
  args: {
    radius: 25,
    heading: 45,
  },
}

export const AccuracyNoHeading: Story = {
  args: {
    radius: 25,
    heading: null,
  },
}

export const InvalidAccuracyWithHeading: Story = {
  args: {
    radius: NaN,
    heading: 45,
  },
}

export const InvalidAccuracyNoHeading: Story = {
  args: {
    radius: NaN,
    heading: null,
  },
}
