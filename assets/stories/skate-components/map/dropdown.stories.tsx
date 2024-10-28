import type { Meta, StoryObj } from "@storybook/react"

import React from "react"
import {
  DropdownItem,
  DropdownMenu,
} from "../../../src/components/map/dropdown"

const meta = {
  component: DropdownMenu,
  args: {
    children: ["Start a detour on route 66"],
  },
  parameters: {
    layout: "centered",
  },
  decorators: [
    (StoryFn, ctx) => {
      const children = ctx.args["children"] as Array<string>

      ctx.args["children"] = children.map((child) => (
        <DropdownItem key={child}>{child}</DropdownItem>
      ))

      return <StoryFn />
    },
  ],
} satisfies Meta<typeof DropdownMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithMoreEntries: Story = {
  args: {
    children: [
      "Start a detour on route 66",
      "Hold this bus for 10 minutes",
      "View old detours for this route",
    ],
  },
}
