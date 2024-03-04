import type { Meta, StoryObj } from "@storybook/react"

import React from "react"

import { MapButton } from "../../../../src/components/map/controls/mapButton"
import { inMapDecorator } from "../../../../.storybook/inMapDecorator"
import { CustomControl } from "../../../../src/components/map/controls/customControl"
import { PlusSquare } from "../../../../src/helpers/bsIcons"

const meta = {
  component: MapButton,
  args: {
    size: undefined,
    title: "Button",
    active: false,
    disabled: false,
  },
  argTypes: {
    size: {
      control: {
        type: "select",
        labels: { sm: "Small", undefined: "Medium", lg: "Large" },
      },
      options: ["sm", undefined, "lg"],
    },
    active: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  render: (args) => (
    <MapButton {...args}>
      <PlusSquare />
    </MapButton>
  ),
} satisfies Meta<typeof MapButton>

export default meta

type Story = StoryObj<typeof meta>

export const Small: Story = { args: { size: "sm" } }

export const Medium: Story = { args: { size: undefined } }

export const Large: Story = { args: { size: "lg" } }

export const Active: Story = { args: { active: true } }

export const Disabled: Story = { args: { disabled: true } }

export const InMap: Story = {
  parameters: {
    layout: "fullscreen",
    stretch: true,
  },
  render: (args) => (
    <CustomControl position="bottomleft">
      <MapButton {...args}>
        <PlusSquare />
      </MapButton>
    </CustomControl>
  ),
  decorators: [inMapDecorator],
}
