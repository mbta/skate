import type { Meta, StoryObj } from "@storybook/react"
import { RoutePropertiesCardRender } from "../../../src/components/mapPage/routePropertiesCard"
import { routePatternFactory } from "../../../tests/factories/routePattern"
import routeFactory from "../../../tests/factories/route"

const routePattern0 = routePatternFactory.build({
  directionId: 0,
})
const routePattern1 = routePatternFactory.build({
  directionId: 0,
})
const routePattern2 = routePatternFactory.build({
  directionId: 1,
})
const routePattern3 = routePatternFactory.build({
  directionId: 1,
})
const routePattern4 = routePatternFactory.build({
  directionId: 1,
})
const routePatterns = {
  [routePattern0.id]: routePattern0,
  [routePattern1.id]: routePattern1,
  [routePattern2.id]: routePattern2,
  [routePattern3.id]: routePattern3,
  [routePattern4.id]: routePattern4,
}

const route = routeFactory.build()

const meta = {
  component: RoutePropertiesCardRender,
  args: {
    routePatterns: routePatterns,
    selectedRoutePattern: routePattern0,
    route,
  },
} satisfies Meta<typeof RoutePropertiesCardRender>
export default meta

type Story = StoryObj<typeof RoutePropertiesCardRender>

export const Default: Story = {}
