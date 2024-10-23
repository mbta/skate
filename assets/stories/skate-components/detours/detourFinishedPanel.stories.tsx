import type { Meta, StoryObj } from "@storybook/react"

import { DetourFinishedPanel } from "../../../src/components/detours/detourPanels/detourFinishedPanel"
import React from "react"

// Copied from Figma
const defaultText = [
  "Detour:",
  "66 Harvard via Allston from",
  "Andrew Station",
  "Outbound",
  "",
  "Turn-by-Turn Directions:",
  "From Harvard St & Babcock St",
  "Right on Babcock St.",
  "Regular Route",
  "",
  "Connection Points:",
  "Harvard St @ Beacon St",
  "Harvard Ave @ Brighton Ave",
  "",
  "Missed Stops (4):",
  "Harvard St @ Stedman St",
  "Harvard St @ Coolidge St",
  "Harvard St opp Verndale St",
  "Harvard Ave @ Commonwealth Ave",
].join("\n")

const turnByTurn = [
  "From Harvard St & Babcock St",
  "Right on Babcock St.",
  "Regular Route",
].join("\n")

const meta = {
  component: DetourFinishedPanel,
  parameters: {
    layout: "fullscreen",
    stretch: true,
  },
  args: {
    copyableDetourText: defaultText,
    editableDirections: turnByTurn,
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
} satisfies Meta<typeof DetourFinishedPanel>

export default meta

type Story = StoryObj<typeof meta>

export const WithActivateButton: Story = {}
export const WithoutActivateButton: Story = {
  args: {
    onActivateDetour: undefined,
  },
}
