import { jest, describe, test, expect } from "@jest/globals"
import React from "react"
import { render } from "@testing-library/react"
import routeFactory from "../factories/route"
import { Route, TimepointsByRouteId } from "../../src/schedule.d"
import useTimepoints from "../../src/hooks/useTimepoints"
import { RoutesProvider } from "../../src/contexts/routesContext"
import { MinimalLadderPage } from "../../src/components/minimalLadderPage"
import routeTabFactory from "../factories/routeTab"
import { BrowserRouter } from "react-router-dom"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import stateFactory from "../factories/applicationState"

jest.mock("../../src/hooks/useTimepoints", () => ({
  __esModule: true,
  default: jest.fn(() => ({})),
}))

const routes: Route[] = [
  routeFactory.build({ id: "1", name: "1" }),
  routeFactory.build({ id: "28", name: "28" }),
  routeFactory.build({ id: "39", name: "39" }),
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

describe("MinimalLadderPage", () => {
  test("renders the preset selection page", () => {
    jest.mocked(useTimepoints).mockImplementationOnce(() => timepointsByRouteId)

    const initialState = stateFactory.build({
      routeTabs: [
        routeTabFactory.build({
          uuid: "abcdef",
          ordering: 0,
          presetName: "Preset 1",
          isCurrentTab: true,
          selectedRouteIds: ["1", "28"],
        }),
        routeTabFactory.build({
          uuid: "ghijkl",
          ordering: undefined,
          presetName: "Preset 2",
          isCurrentTab: false,
          selectedRouteIds: ["28"],
        }),
        routeTabFactory.build({
          ordering: 1,
          isCurrentTab: false,
          selectedRouteIds: ["39"],
        }),
      ],
    })
    const { asFragment } = render(
      <StateDispatchProvider state={initialState} dispatch={jest.fn()}>
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
