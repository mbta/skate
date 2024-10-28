import type { Meta, StoryObj } from "@storybook/react"

import { defaultCenter } from "../../src/components/map"

import { StreetViewButton } from "../../src/components/streetViewButton"

const meta = {
  component: StreetViewButton,
  args: {
    latitude: defaultCenter.lat,
    longitude: defaultCenter.lng,
  },
} satisfies Meta<typeof StreetViewButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
