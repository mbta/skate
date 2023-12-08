import type { Meta, StoryObj } from "@storybook/react"

import { argsUpdater } from "../../../../.storybook/argsUpdater"

import { StreetViewSwitch } from "../../../../src/components/map/controls/StreetViewSwitch"

import { Decorator } from "@storybook/react"
import React from "react"

const inControlDivDecorator: Decorator = (StoryFn) => (
  <div className="leaflet-control leaflet-bar c-street-view-switch position-absolute">
    <StoryFn />
  </div>
)

const meta = {
  component: StreetViewSwitch,
  args: {
    streetViewEnabled: false,
  },
  argTypes: {
    setStreetViewEnabled: { table: { disable: true } },
  },
  decorators: [
    argsUpdater(
      "setStreetViewEnabled",
      ({ streetViewEnabled }, newStreetViewEnabled) => ({
        streetViewEnabled:
          typeof newStreetViewEnabled === "function"
            ? newStreetViewEnabled(streetViewEnabled)
            : newStreetViewEnabled,
      })
    ),
    inControlDivDecorator,
    (StoryFn) => (
      <div className="w-100 h-100" style={{ minHeight: "200px" }}>
        <StoryFn />
      </div>
    ),
  ],
} satisfies Meta<typeof StreetViewSwitch>

export default meta

type Story = StoryObj<typeof meta>

export const StreetViewDisabled: Story = {}

export const StreetViewEnabled: Story = {
  args: {
    streetViewEnabled: true,
  },
}
