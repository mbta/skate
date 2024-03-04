import type { Meta, StoryObj } from "@storybook/react"

import React from "react"

import { MapButton } from "../../../../src/components/map/controls/mapButton"
import { inMapDecorator } from "../../../../.storybook/inMapDecorator"
import { CustomControl } from "../../../../src/components/map/controls/customControl"

const meta = {
  component: MapButton,
  args: {
    size: "m",
    active: false,
    disabled: false,
  },
  argTypes: {
    size: { options: ["s", "m", "l"] },
    active: { control: "boolean" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof MapButton>

export default meta

type Story = StoryObj<typeof meta>

export const Small: Story = { args: { size: "s" } }

export const Medium: Story = { args: { size: "m" } }

export const Large: Story = { args: { size: "l" } }

export const Active: Story = { args: { active: true } }

export const Disabled: Story = { args: { disabled: true } }

export const InMap: Story = {
  parameters: {
    layout: "fullscreen",
    stretch: true,
  },
  render(args) {
    return (
      <CustomControl position="bottomleft">
        <MapButton {...args} />
      </CustomControl>
    )
  },
  decorators: [inMapDecorator],
}
