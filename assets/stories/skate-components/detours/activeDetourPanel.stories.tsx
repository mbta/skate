import type { Meta, StoryObj } from "@storybook/react"

import React from "react"
import { ActiveDetourPanel } from "../../../src/components/detours/activeDetourPanel"

const meta = {
  component: ActiveDetourPanel,
  parameters: {
    layout: "fullscreen",
    stretch: true,
  },
  args: {},
  // The bootstrap CSS reset is supposed to set box-sizing: border-box by
  // default, we should be able to remove this after that is added
  decorators: [
    (StoryFn) => (
      <div className="border-box inherit-box h-100">
        <StoryFn />
      </div>
    ),
  ],
} satisfies Meta<typeof ActiveDetourPanel>

export default meta

type Story = StoryObj<typeof meta>

export const Story: Story = {}
