import type { Meta, StoryObj } from "@storybook/react"
import { LoggedInAs } from "../../../src/components/loggedInAs"

const meta = {
  component: LoggedInAs,
  args: {
    email: "username@mbta.com",
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof LoggedInAs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
