import type { Meta, StoryObj } from "@storybook/react"

import { DetourFinishedPanel } from "../../../src/components/detours/detourFinishedPanel"

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

const meta = {
  component: DetourFinishedPanel,
  parameters: {
    layout: "fullscreen",
    stretch: true,
  },
  args: {
    detourText: defaultText,
  },
} satisfies Meta<typeof DetourFinishedPanel>

export default meta

type Story = StoryObj<typeof meta>

export const Story: Story = {}
