import type { Meta, StoryObj } from "@storybook/react"

import React from "react"
import { ActiveDetourPanel } from "../../../src/components/detours/detourPanels/activeDetourPanel"
import { stopFactory } from "../../../tests/factories/stop"

const defaultText = [
  "Detour:",
  "66 Harvard via Allston from",
  "Andrew Station",
  "Outbound",
  "",
  "Turn-by-Turn Directions:",
  "Start at Centre St & John St",
  "Right on John St",
  "Left on Abbotsford Rd",
  "Right on Boston St",
  "Regular Route",
  "",
  "Connection Points:",
  "Centre St & John St",
  "Boston St",
  "",
  "Missed Stops (3):",
  "Example St @ Sample Ave",
  "Example St opp Random Way",
  "Example St @ Fake Blvd",
].join("\n")

const meta = {
  component: ActiveDetourPanel,
  parameters: {
    layout: "fullscreen",
    stretch: true,
  },
  args: {
    copyableDetourText: defaultText,
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
    onOpenDeactivateModal: undefined,
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
} satisfies Meta<typeof ActiveDetourPanel>

export default meta

type Story = StoryObj<typeof meta>

export const Story: Story = {}
