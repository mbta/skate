import type { Meta, StoryObj } from "@storybook/react"
import {
  RecenterButton,
  RecenterControl,
} from "../../../../src/components/map/controls/recenterControl"
import React from "react"
import { inMapDecorator } from "../../../../.storybook/inMapDecorator"
import { argsUpdater } from "../../../../.storybook/argsUpdater"

const meta = {
  component: RecenterButton,
  parameters: {
    layout: "centered",
  },
  decorators: [argsUpdater("onActivate", (_) => ({ active: true }))],
} satisfies Meta<typeof RecenterButton>
export default meta

type Story = StoryObj<typeof meta>

export const Inactive: Story = {}

export const Active: Story = {
  args: {
    active: true,
  },
}

export const InMap: Story = {
  parameters: {
    layout: "fullscreen",
    stretch: true,
  },
  render(args) {
    return <RecenterControl {...args} position="topright" />
  },
  decorators: [inMapDecorator],
}
