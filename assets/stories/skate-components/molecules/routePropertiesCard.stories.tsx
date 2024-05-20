import type { Meta, StoryObj } from "@storybook/react"
import { RoutePropertiesCard } from "../../../src/components/mapPage/routePropertiesCard"
import { routePatternFactory } from "../../../tests/factories/routePattern"
import routeFactory from "../../../tests/factories/route"

const routePattern0 = routePatternFactory.build({
  directionId: 0,
  headsign: "Dedham Mall",
  id: "52-5-0",
  name: "Watertown - Dedham Mall via Meadowbrook Rd",
  routeId: "52",
})
const routePattern1 = routePatternFactory.build({
  directionId: 0,
  headsign: "Charles River Loop",
  id: "52-4-0",
  name: "Watertown - Charles River Loop via Meadowbrook Rd",
  routeId: "52",
})
const routePattern2 = routePatternFactory.build({
  directionId: 1,
  headsign: "Watertown Yard",
  id: "52-5-1",
  name: "Dedham Mall - Watertown via Meadowbrook Rd",
  routeId: "52",
})
const routePattern3 = routePatternFactory.build({
  directionId: 1,
  headsign: "Watertown Yard",
  id: "52-4-1",
  name: "Charles River Loop - Watertown via Meadowbrook Rd",
  routeId: "52",
})
const routePattern4 = routePatternFactory.build({
  directionId: 1,
  headsign: "Watertown Yard via Dedham St",
  id: "52-6-1",
  name: "Charles River Loop - Watertown via Dedham St",
  routeId: "52",
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
    selectedRoutePattern: routePattern0,
    route,
  },
} satisfies Meta<typeof RoutePropertiesCard>
export default meta

type Story = StoryObj<typeof RoutePropertiesCard>

export const Default: Story = {}
export const WithInboundSelected: Story = {
  args: {
    selectedRoutePattern: routePattern3,
  },
}
