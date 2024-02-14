import type { Meta, StoryObj } from "@storybook/react"
import NavMenu from "../../src/components/nav/navMenu"
import { MemoryRouter } from "react-router-dom"
import React from "react"

const meta = {
  component: NavMenu,
  title: "Organisms/Nav/Mobile <NavMenu>",
  args: {
    mobileMenuIsOpen: true,
  },
  decorators: [
    (StoryFn) => (
      <MemoryRouter>
        <StoryFn />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof NavMenu>
export default meta

type Story = StoryObj<typeof meta>

export const Story: Story = {}
