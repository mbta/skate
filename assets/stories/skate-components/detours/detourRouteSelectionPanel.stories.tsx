import type { Meta, StoryObj } from "@storybook/react"

import React from "react"
import { DetourRouteSelectionPanel } from "../../../src/components/detours/detourRouteSelectionPanel"

const meta = {
  component: DetourRouteSelectionPanel,
  parameters: {
    layout: "fullscreen",
    stretch: true,
  },
  args: {
    routeName: "39",
  },
  // The bootstrap CSS reset is supposed to set box-sizing: border-box by
  // default, we should be able to remove this after that is added
  decorators: [
    (StoryFn) => (
      <div className="border-box inherit-box h-100">
        <StoryFn />
      </div>
    ),
  ],
} satisfies Meta<typeof DetourRouteSelectionPanel>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const NoRouteSelected: Story = {
  args: {
    routeName: undefined,
  },
}
