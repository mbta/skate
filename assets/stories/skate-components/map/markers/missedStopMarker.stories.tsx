import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import {
  MissedStopIcon,
  StopIconType,
} from "../../../../src/components/map/markers/stopMarker"

const meta = {
  component: MissedStopIcon,
  decorators: [
    (Story) => (
      <div className="c-missed-stop-icon-container">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MissedStopIcon>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Used at zoom levels `<= 14`
 */
export const Small: Story = {
  args: {
    type: StopIconType.Small,
  },
}

/**
 * Used at zoom levels `[15, 16]`
 */
export const Medium: Story = {
  args: {
    type: StopIconType.Medium,
  },
}

/**
 * Used at zoom levels `>= 17`
 */
export const Large: Story = {
  args: {
    type: StopIconType.Large,
  },
}
