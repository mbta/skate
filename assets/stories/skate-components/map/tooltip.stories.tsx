import React from "react"
import { MapTooltip } from "../../../src/components/map/tooltip"
import type { Meta, StoryObj } from "@storybook/react"
import { inMapDecorator } from "../../../.storybook/inMapDecorator"
import { Polyline } from "react-leaflet"

const meta = {
  component: MapTooltip,
  args: {
    children: "Tooltip Title",
    permanent: true,
  },
  argTypes: {
    permanent: { table: { disable: true } },
  },
  render: ({ children, permanent }) => (
    <Polyline
      className="c-detour_map--original-route-shape"
      positions={[
        { lat: 42.36, lng: -71.03 },
        { lat: 42.36, lng: -71.09 },
      ]}
    >
      <MapTooltip permanent={permanent}>{children}</MapTooltip>
    </Polyline>
  ),
  decorators: [inMapDecorator],
  parameters: { layout: "fullscreen", stretch: true },
} satisfies Meta<typeof MapTooltip>

export default meta

type Story = StoryObj<typeof meta>

export const Visible: Story = {}

export const OnlyVisibleOnHover: Story = {
  args: {
    permanent: false,
  },
}
