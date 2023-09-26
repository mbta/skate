import type { Meta, StoryObj } from "@storybook/react"

import ShuttleMapPage from "../../src/components/shuttleMapPage"

const meta = {
  title: "pages/Shuttle Map",
  component: ShuttleMapPage,
} satisfies Meta<typeof ShuttleMapPage>

export default meta
type Story = StoryObj<typeof meta>

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/react/api/csf
 * to learn how to use render functions.
 */
export const Primary: Story = {}
