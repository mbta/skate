import type { Meta, StoryObj } from "@storybook/react"

import React from "react"
import { PastDetourPanel } from "../../../src/components/detours/pastDetourPanel"

const meta = {
  component: PastDetourPanel,
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
} satisfies Meta<typeof PastDetourPanel>

export default meta

type Story = StoryObj<typeof meta>

export const Story: Story = {}
