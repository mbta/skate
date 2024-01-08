import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { MemoryRouter } from "react-router-dom"

import { AppRoutes } from "../../../src/components/app"

const meta = {
  component: AppRoutes,
  parameters: {
    layout: "fullscreen",
    stretch: true,
  },
  decorators: [
    (StoryFn) => (
      <MemoryRouter initialEntries={["/"]}>
        <StoryFn />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof AppRoutes>
export default meta

type Story = StoryObj<typeof meta>

export const Story: Story = {}
