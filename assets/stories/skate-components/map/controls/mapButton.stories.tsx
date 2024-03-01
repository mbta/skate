import type { Meta, StoryObj } from "@storybook/react"

import { MapButton } from "../../../../src/components/map/controls/mapButton"

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
