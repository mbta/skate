import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import {
  StopIcon,
  StopIconType,
} from "../../../../src/components/map/markers/stopMarker"

const meta = {
  component: StopIcon,
  decorators: [
    (Story) => (
      <div className="c-stop-icon-container">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StopIcon>

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
