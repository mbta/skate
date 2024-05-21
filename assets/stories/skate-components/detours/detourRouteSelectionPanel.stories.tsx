import type { Meta, StoryObj } from "@storybook/react"
import React from "react"

import {
  DetourRouteSelectionPanel,
  SelectedRouteInfoWithRoute,
  SelectedRouteInfoWithoutRoute,
} from "../../../src/components/detours/detourRouteSelectionPanel"
import { routePatternFactory } from "../../../tests/factories/routePattern"
import routeFactory from "../../../tests/factories/route"
import { RoutesProvider } from "../../../src/contexts/routesContext"

const routePattern0 = routePatternFactory.build({
  directionId: 0,
  headsign: "Forest Hills",
  id: "39-3-0",
  name: "Back Bay Station - Forest Hills Station",
  routeId: "39",
})
const routePattern1 = routePatternFactory.build({
  directionId: 0,
  headsign: "Dedham Line via Forest Hills",
  id: "39-7-0",
  name: "Huntington Ave & Longwood Ave - Forest Hills Station",
  routeId: "39",
})
const routePattern2 = routePatternFactory.build({
  directionId: 1,
  headsign: "Back Bay",
  id: "39-3-1",
  name: "Forest Hills Station - Back Bay Station",
  routeId: "39",
})
const routePattern3 = routePatternFactory.build({
  directionId: 1,
  headsign: "Avenue Louis Pasteur",
  id: "39-7-1",
  name: "Forest Hills Station - Huntington Ave & Longwood Ave",
  routeId: "39",
})

const route1 = routeFactory.build({ id: "1", name: "1" })
const route39 = routeFactory.build({ id: "39", name: "39" })
const route66 = routeFactory.build({ id: "66", name: "66" })

const allRoutes = [route1, route39, route66]

const meta = {
  component: DetourRouteSelectionPanel,
  parameters: {
    layout: "fullscreen",
    stretch: true,
  },
  args: {
    allRoutes,
    selectedRouteInfo: new SelectedRouteInfoWithRoute({
      selectedRoute: route39,
      routePatterns: {
        [routePattern0.id]: routePattern0,
        [routePattern1.id]: routePattern1,
        [routePattern2.id]: routePattern2,
        [routePattern3.id]: routePattern3,
      },
      selectedRoutePatternId: routePattern0.id,
    }),
  },
  argTypes: {
    allRoutes: { table: { disable: true } },
    selectedRouteInfo: { table: { disable: true } },
  },
  // The bootstrap CSS reset is supposed to set box-sizing: border-box by
  // default, we should be able to remove this after that is added
  decorators: [
    (StoryFn) => (
      <RoutesProvider routes={allRoutes}>
        <div className="border-box inherit-box h-100">
          <StoryFn />
        </div>
      </RoutesProvider>
    ),
  ],
} satisfies Meta<typeof DetourRouteSelectionPanel>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const NoRouteSelected: Story = {
  args: {
    selectedRouteInfo: new SelectedRouteInfoWithoutRoute(),
  },
}
