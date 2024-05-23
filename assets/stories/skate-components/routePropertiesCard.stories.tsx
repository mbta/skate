import type { Meta, StoryObj } from "@storybook/react"
import React from "react"

import RoutePropertiesCard from "../../src/components/mapPage/routePropertiesCard"
import { routePatternFactory } from "../../tests/factories/routePattern"
import routeFactory from "../../tests/factories/route"
import { RoutesProvider } from "../../src/contexts/routesContext"
import stopFactory from "../../tests/factories/stop"
import shapeFactory from "../../tests/factories/shape"

const outboundStops = [
  stopFactory.build({ name: "Watertown Square" }),
  stopFactory.build({ name: "Centre St @ Beacon St" }),
  stopFactory.build({ name: "Charles River Loop" }),
  stopFactory.build({ name: "Dedham Mall" }),
]

const routePattern0 = routePatternFactory.build({
  directionId: 0,
  headsign: "Dedham Mall",
  id: "52-5-0",
  name: "Watertown - Dedham Mall via Meadowbrook Rd",
  routeId: "52",
  shape: shapeFactory.build({ stops: outboundStops }),
})
const routePattern1 = routePatternFactory.build({
  directionId: 0,
  headsign: "Charles River Loop",
  id: "52-4-0",
  name: "Watertown - Charles River Loop via Meadowbrook Rd",
  routeId: "52",
  shape: shapeFactory.build({ stops: outboundStops }),
})
const routePattern2 = routePatternFactory.build({
  directionId: 1,
  headsign: "Watertown Yard",
  id: "52-5-1",
  name: "Dedham Mall - Watertown via Meadowbrook Rd",
  routeId: "52",
  shape: shapeFactory.build({ stops: outboundStops.reverse() }),
})
const routePattern3 = routePatternFactory.build({
  directionId: 1,
  headsign: "Watertown Yard",
  id: "52-4-1",
  name: "Charles River Loop - Watertown via Meadowbrook Rd",
  routeId: "52",
  shape: shapeFactory.build({ stops: outboundStops.reverse() }),
})
const routePattern4 = routePatternFactory.build({
  directionId: 1,
  headsign: "Watertown Yard via Dedham St",
  id: "52-6-1",
  name: "Charles River Loop - Watertown via Dedham St",
  routeId: "52",
  shape: shapeFactory.build({ stops: outboundStops.reverse() }),
})
const routePatterns = {
  [routePattern0.id]: routePattern0,
  [routePattern1.id]: routePattern1,
  [routePattern2.id]: routePattern2,
  [routePattern3.id]: routePattern3,
  [routePattern4.id]: routePattern4,
}

const route = routeFactory.build({ id: "52" })

const meta = {
  component: RoutePropertiesCard,
  args: {
    routePatterns: routePatterns,
    selectedRoutePatternId: routePattern0.id,
    selectRoutePattern: () => {},
  },
  argTypes: {
    routePatterns: { table: { disable: true } },
    selectedRoutePatternId: { table: { disable: true } },
    selectRoutePattern: { table: { disable: true } },
    onClose: { table: { disable: true } },
  },
  decorators: [
    (StoryFn) => (
      <RoutesProvider routes={[route]}>
        <StoryFn />
      </RoutesProvider>
    ),
  ],
} satisfies Meta<typeof RoutePropertiesCard>
export default meta

type Story = StoryObj<typeof RoutePropertiesCard>

export const Default: Story = {}
export const WithInboundSelected: Story = {
  args: {
    selectedRoutePatternId: routePattern3.id,
  },
}

export const WithVariantsOpenedByDefault: Story = {
  args: {
    defaultOpened: "variants",
  },
}
export const WithStopsOpenedByDefault: Story = {
  args: {
    defaultOpened: "stops",
  },
}
