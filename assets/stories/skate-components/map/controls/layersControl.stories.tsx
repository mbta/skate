import type { Meta, StoryObj } from "@storybook/react"
import React from "react"

import { inMapDecorator } from "../../../../.storybook/inMapDecorator"

import {
  LayersButton,
  LayersControl,
} from "../../../../src/components/map/controls/layersControl"

const meta = {
  component: LayersButton,
  parameters: {
    layout: "centered",
  },
  args: {
    showLayersList: true,
    pullbackLayerEnabled: false,
    tileType: "base",
  },
} satisfies Meta<typeof LayersButton>
export default meta

type Story = StoryObj<typeof meta>

export const PopoverClosed: Story = {
  args: {
    showLayersList: false,
  },
}

export const PopoverOpen: Story = {}

export const InMap: Story = {
  render: (args) => {
    return <LayersControl {...args} />
  },
  parameters: {
    layout: "fullscreen",
    stretch: true,
  },
  decorators: [inMapDecorator],
}

export const WithoutPullbackControls: Story = {
  argTypes: {
    pullbackLayerEnabled: { table: { disable: true } },
    onTogglePullbackLayer: { table: { disable: true } },
  },
  args: {
    onTogglePullbackLayer: undefined,
  },
}

export const WithoutPullbackControlsInMap: Story = {
  ...WithoutPullbackControls,
  ...InMap,
}
