import { jest, describe, test, expect } from "@jest/globals"
import React from "react"
import { render, fireEvent } from "@testing-library/react"
import routeFactory from "../factories/route"
import RouteLadders, { findRouteById } from "../../src/components/routeLadders"
import { Route, TimepointsByRouteId } from "../../src/schedule.d"
import useTimepoints from "../../src/hooks/useTimepoints"
import { RoutesProvider } from "../../src/contexts/routesContext"

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

    const { asFragment } = render(
      <RoutesProvider routes={routes}>
        <RouteLadders
          selectedRouteIds={routes.map((route) => route.id)}
          selectedVehicleId={undefined}
          deselectRoute={jest.fn()}
          reverseLadder={jest.fn()}
          toggleCrowding={jest.fn()}
          ladderDirections={{}}
          ladderCrowdingToggles={{}}
        />
      </RoutesProvider>
    )

    expect(asFragment()).toMatchSnapshot()
  })

  test("can scroll horizontally with mouse wheel", () => {
    const result = render(
      <RouteLadders
        selectedRouteIds={routes.map((route) => route.id)}
        selectedVehicleId={undefined}
        deselectRoute={jest.fn()}
        reverseLadder={jest.fn()}
        toggleCrowding={jest.fn()}
        ladderDirections={{}}
        ladderCrowdingToggles={{}}
      />
    )

    const routeLaddersDiv = result.getByTestId("route-ladders-div")
    routeLaddersDiv.scrollTo = jest.fn()

    fireEvent.wheel(routeLaddersDiv, { deltaY: 10 })

    expect(routeLaddersDiv.scrollTo).toHaveBeenCalled()
  })

  describe("findRouteById", () => {
    test("finds a route in a list by its id", () => {
      expect(findRouteById(routes, "28")).toEqual(
        routeFactory.build({
          id: "28",
          name: "28",
        })
      )
    })
  
    test("returns undefined if the route isn't found", () => {
      expect(findRouteById(routes, "missing")).toEqual(undefined)
    })
  
    test("returns undefined if routes is null", () => {
      expect(findRouteById(null, "does not matter")).toEqual(undefined)
    })
  })
})
