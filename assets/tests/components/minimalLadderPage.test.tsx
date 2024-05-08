import { jest, describe, test, expect } from "@jest/globals"
import React from "react"
import { render } from "@testing-library/react"
import routeFactory from "../factories/route"
import { Route, TimepointsByRouteId } from "../../src/schedule.d"
import useTimepoints from "../../src/hooks/useTimepoints"
import { RoutesProvider } from "../../src/contexts/routesContext"
import { MinimalLadderPage } from "../../src/components/minimalLadderPage"
import { initialState } from "../../src/state"
import routeTabFactory from "../factories/routeTab"
import { BrowserRouter } from "react-router-dom"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"

jest.mock("../../src/hooks/useTimepoints", () => ({
  __esModule: true,
  default: jest.fn(() => ({})),
}))

const routes: Route[] = [
  routeFactory.build({ id: "1", name: "1" }),
  routeFactory.build({ id: "28", name: "28" }),
]
const timepointsByRouteId: TimepointsByRouteId = {
  "1": [
    { id: "WASMA", name: "WASMA Name" },
    { id: "MELWA", name: "MELWA Name" },
    { id: "HHGAT", name: "HHGAT Name" },
  ],
  "28": [
    { id: "MATPN", name: "MATPN Name" },
    { id: "WELLH", name: "WELLH Name" },
    { id: "MORTN", name: "MORTN Name" },
  ],
  "71": undefined,
  "73": null,
}

describe("RouteLadders", () => {
  test("renders a route ladder", () => {
    jest.mocked(useTimepoints).mockImplementationOnce(() => timepointsByRouteId)

    const mockState = {
      ...initialState,
      routeTabs: [
        routeTabFactory.build({
          ordering: 0,
          isCurrentTab: true,
          selectedRouteIds: ["1"],
        }),
        routeTabFactory.build({
          ordering: undefined,
          isCurrentTab: false,
          selectedRouteIds: ["28"],
        }),
        routeTabFactory.build({
          ordering: 1,
          isCurrentTab: false,
          selectedRouteIds: ["39"],
        }),
      ],
    }
    const { asFragment } = render(
      <StateDispatchProvider state={mockState} dispatch={jest.fn()}>
        <BrowserRouter>
          <RoutesProvider routes={routes}>
            <MinimalLadderPage />
          </RoutesProvider>
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(asFragment()).toMatchSnapshot()
  })
})
