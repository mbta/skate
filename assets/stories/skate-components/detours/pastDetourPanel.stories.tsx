import type { Meta, StoryObj } from "@storybook/react"

import React from "react"
import { PastDetourPanel } from "../../../src/components/detours/pastDetourPanel"
import { stopFactory } from "../../../tests/factories/stop"

const meta = {
  component: PastDetourPanel,
  parameters: {
    layout: "fullscreen",
    stretch: true,
  },
  args: {
    directions: [
      { instruction: "Start at Centre St & John St" },
      { instruction: "Right on John St" },
      { instruction: "Left on Abbotsford Rd" },
      { instruction: "Right on Boston St" },
      { instruction: "Regular Route" },
    ],
    connectionPoints: ["Centre St & John St", "Boston St"],
    missedStops: [
      stopFactory.build({ name: "Example St @ Sample Ave" }),
      stopFactory.build({ name: "Example St opp Random Way" }),
      stopFactory.build({ name: "Example St @ Fake Blvd" }),
    ],
    routeName: "66",
    routeDescription: "Harvard via Allston",
    routeOrigin: "from Andrew Station",
    routeDirection: "Outbound",
    onNavigateBack: undefined,
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
} satisfies Meta<typeof PastDetourPanel>

export default meta

type Story = StoryObj<typeof meta>

export const Story: Story = {}
