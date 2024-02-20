import type { Meta, StoryObj } from "@storybook/react"
import { DiversionPage } from "../../../src/components/detours/diversionPage"
import { route39shape } from "../__story-data__/shape"

const meta = {
  component: DiversionPage,
  parameters: {
    layout: "fullscreen",
    stretch: true,
  },
  args: {
    // Provide default route settings
    originalRoute: {
      routeDescription: "Harvard via Allston",
      routeOrigin: "from Andrew Station",
      routeDirection: "Outbound",
      routeName: "39",
      shape: route39shape,
      zoom: 14,
      center: { lat: 42.33, lng: -71.11 },
    },
  },
  argTypes: {
    originalRoute: { table: { disable: true } },
  },
} satisfies Meta<typeof DiversionPage>
export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
