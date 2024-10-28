import type { Meta, StoryObj } from "@storybook/react"
import {
  LocationSearchMarkerIcon,
  LocationSearchMarker,
} from "../../../../src/components/map/markers/locationSearchMarker"
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
  render: LocationSearchMarkerIcon,
  component: LocationSearchMarker,
  parameters: {
    layout: "centered",
    stretch: false,
  },
} satisfies Meta<typeof LocationSearchMarker>

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
  render: LocationSearchMarker,
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
