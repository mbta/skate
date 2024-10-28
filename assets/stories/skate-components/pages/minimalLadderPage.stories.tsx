import type { Meta, StoryObj } from "@storybook/react"
import { MinimalLadderPage } from "../../../src/components/minimalLadderPage"

const meta = {
  title: "pages/Minimal Ladder Page",
  component: MinimalLadderPage,
  parameters: {
    layout: "fullscreen",
    stretch: true,
  },
} satisfies Meta<typeof MinimalLadderPage>
export default meta

type Story = StoryObj<typeof meta>

export const Story: Story = {}
