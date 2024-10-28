import type { Meta, StoryObj } from "@storybook/react"
import React from "react"

import LadderPage from "../../../src/components/ladderPage"
import { RoutesProvider } from "../../../src/contexts/routesContext"
import { LadderDirection } from "../../../src/models/ladderDirection"

import stateFactory from "../../../tests/factories/applicationState"
import routeFactory from "../../../tests/factories/route"
import routeTabFactory from "../../../tests/factories/routeTab"
import { RealDispatchWrapper } from "../../../tests/testHelpers/wrappers"

routeFactory.rewindSequence()
const routes = routeFactory.buildList(6, { garages: ["Garage A", "Garage B"] })

const meta = {
  title: "pages/Route Ladders",
  component: LadderPage,
  parameters: {
    layout: "fullscreen",
    stretch: true,
  },
  decorators: [
    (Story) => (
      <RealDispatchWrapper
        initialState={stateFactory.build({
          pickerContainerIsVisible: true,
          showGaragesFilter: true,
          routeTabs: [
            routeTabFactory.build(),
            routeTabFactory.build({
              presetName: "Main Tab",
              isCurrentTab: true,
              selectedRouteIds: routes.slice(0, 3).map((v) => v.id),
              ladderDirections: {
                [routes[1].id]: LadderDirection.OneToZero,
                [routes[2].id]: LadderDirection.ZeroToOne,
              },
            }),
            routeTabFactory.build({}),
          ],
        })}
      >
        <Story />
      </RealDispatchWrapper>
    ),
    (Story) => (
      <RoutesProvider routes={routes}>
        <Story />
      </RoutesProvider>
    ),
  ],
} satisfies Meta<typeof LadderPage>
export default meta

type Story = StoryObj<typeof meta>

export const Story: Story = {}
