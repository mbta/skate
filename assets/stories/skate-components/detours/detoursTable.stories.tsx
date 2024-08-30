import type { Meta, StoryObj } from "@storybook/react"

import React from "react"
import { DetoursTable } from "../../../src/components/detoursTable"

const meta = {
  component: DetoursTable,
  parameters: {
    layout: "fullscreen",
    stretch: true,
  },
  args: {
    data: [
      {
        route: "45",
        direction: "Outbound",
        name: "Franklin Park via Ruggles Station",
        intersection: "John F. Kennedy St & Memorial Drive",
        activeSince: 1722372950,
      },
      {
        route: "83",
        direction: "Inbound",
        name: "Central Square",
        intersection: "Pearl Street & Clearwell Ave",
        activeSince: 1722361948,
      },
      {
        route: "SL2",
        direction: "Outbound",
        name: "Rindge Ave",
        intersection: "Pearl Street & Clearwell Ave",
        activeSince: 1721361948,
      },
    ],
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
} satisfies Meta<typeof DetoursTable>

export default meta

type Story = StoryObj<typeof meta>

export const WithData: Story = {}

export const WithoutData: Story = {
  args: {
    data: [],
  },
}
