import type { Meta, StoryObj } from "@storybook/react"

import { DiversionPanel } from "../../../src/components/detours/diversionPanel"
import stopFactory from "../../../tests/factories/stop"

const meta = {
  component: DiversionPanel,
  parameters: {
    layout: "fullscreen",
    stretch: true,
  },
  args: {
    routeName: "66",
    routeDescription: "Harvard via Allston",
    routeOrigin: "from Andrew Station",
    routeDirection: "Outbound",
  },
  argTypes: {
    // Since there's not a good way to expose JSX to the Storybook frontend yet:
    // Disable `ReactNode` args to reduce UI noise and prevent invalid parameters.
    directions: { table: { disable: true } },
    missedStops: { table: { disable: true } },
  },
} satisfies Meta<typeof DiversionPanel>
export default meta

type Story = StoryObj<typeof meta>

export const WithoutDirections: Story = {}

export const WithDirections: Story = {
  args: {
    directions: [
      { instruction: "Start at Centre St & John St" },
      { instruction: "Right on John St" },
      { instruction: "Left on Abbotsford Rd" },
      { instruction: "Right on Boston St" },
      { instruction: "Regular Route" },
    ],
  },
}

export const WithStops: Story = {
  args: {
    ...WithDirections.args,
    missedStops: [
      stopFactory.build({ name: "Example St @ Sample Ave" }),
      stopFactory.build({ name: "Example St opp Random Way" }),
      stopFactory.build({ name: "Example St @ Fake Blvd" }),
    ],
  },
}
