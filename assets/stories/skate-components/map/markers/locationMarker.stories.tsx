import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { LocationMarker } from "../../../../src/components/mapMarkers"
import { LocationDotIcon } from "../../../../src/helpers/icon"
import { inMapDecorator } from "../../../../.storybook/inMapDecorator"
import locationSearchResultFactory from "../../../../tests/factories/locationSearchResult"

const location = locationSearchResultFactory.build({
  latitude: 42.360082,
  longitude: -71.05888,
})

const meta = {
  args: { location },
  argTypes: {
    location: { table: { disable: true } },
  },
  render: ({ selected }) => {
    return (
      <LocationDotIcon
        className={
          "c-location-dot-icon" +
          (selected ? " c-location-dot-icon--selected" : "")
        }
      />
    )
  },
  component: LocationMarker,
  parameters: {
    layout: "centered",
    stretch: false,
  },
} satisfies Meta<typeof LocationMarker>

export default meta
type Story = StoryObj<typeof meta>

export const Unselected: Story = {
  args: {
    selected: false,
  },
}

export const Selected: Story = {
  args: {
    selected: true,
  },
}

const InMap: Story = {
  decorators: [inMapDecorator],
  render: LocationMarker,
  parameters: {
    layout: "fullscreen",
    stretch: true,
  },
}

export const UnselectedInMap: Story = {
  ...Unselected,
  ...InMap,
}

export const SelectedInMap: Story = {
  ...Selected,
  ...InMap,
}
