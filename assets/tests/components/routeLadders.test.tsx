import { jest, describe, test, expect } from "@jest/globals"
import React from "react"
import renderer from "react-test-renderer"
import { render, fireEvent } from "@testing-library/react"
import routeFactory from "../factories/route"
import RouteLadders from "../../src/components/routeLadders"
import { Route, TimepointsByRouteId } from "../../src/schedule.d"

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
    const tree = renderer
      .create(
        <RouteLadders
          routes={routes}
          timepointsByRouteId={timepointsByRouteId}
          selectedVehicleId={undefined}
          deselectRoute={jest.fn()}
          reverseLadder={jest.fn()}
          toggleCrowding={jest.fn()}
          ladderDirections={{}}
          ladderCrowdingToggles={{}}
          routesWithAlerts={[]}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("can scroll horizontally with mouse wheel", () => {
    const result = render(
      <RouteLadders
        routes={routes}
        timepointsByRouteId={timepointsByRouteId}
        selectedVehicleId={undefined}
        deselectRoute={jest.fn()}
        reverseLadder={jest.fn()}
        toggleCrowding={jest.fn()}
        ladderDirections={{}}
        ladderCrowdingToggles={{}}
        routesWithAlerts={[]}
      />
    )

    const routeLaddersDiv = result.getByTestId("route-ladders-div")
    routeLaddersDiv.scrollTo = jest.fn()

    fireEvent.wheel(routeLaddersDiv, { deltaY: 10 })

    expect(routeLaddersDiv.scrollTo).toHaveBeenCalled()
  })
})
