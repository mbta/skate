import React from "react"

import type { Meta, StoryObj } from "@storybook/react"
import { DetourNavIcon } from "../../../src/helpers/navIcons"
import { LadderIcon } from "../../../src/helpers/icon"

const meta = {
  component: LadderIcon,
  parameters: {
    layout: "centered",
    stretch: false,
  },
} satisfies Meta<typeof LadderIcon>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const UnselectedInContext: Story = {
  decorators: [
    (StoryFn) => (
      <div className="c-left-nav__link">
        <StoryFn className="c-left-nav__icon" />
      </div>
    ),
  ],
}

export const SelectedInContext: Story = {
  decorators: [
    (StoryFn) => (
      <div className="c-left-nav__link c-left-nav__link--active">
        <StoryFn className="c-left-nav__icon" />
      </div>
    ),
  ],
}
