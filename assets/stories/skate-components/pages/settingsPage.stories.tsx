import type { Meta, StoryObj } from "@storybook/react-webpack5"
import SettingsPage from "../../../src/components/settingsPage"

const meta = {
  title: "pages/Settings Page",
  component: SettingsPage,
  parameters: {
    layout: "fullscreen",
    stretch: true,
  },
} satisfies Meta<typeof SettingsPage>
export default meta

type Story = StoryObj<typeof meta>

export const Story: Story = {}
