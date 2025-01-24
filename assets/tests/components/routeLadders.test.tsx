import { jest, describe, test, expect, beforeEach } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import React from "react"
import { render, fireEvent } from "@testing-library/react"
import routeFactory from "../factories/route"
import RouteLadders, { findRouteById } from "../../src/components/routeLadders"
import { Route, TimepointsByRouteId } from "../../src/schedule.d"
import useTimepoints from "../../src/hooks/useTimepoints"
import { RoutesProvider } from "../../src/contexts/routesContext"
import { routeAlert } from "../testHelpers/selectors/components/routeLadder"
import useAlerts from "../../src/hooks/useAlerts"
import { useActiveDetours } from "../../src/hooks/useDetours"
import { simpleDetourFactory } from "../factories/detourListFactory"

jest.mock("../../src/hooks/useTimepoints", () => ({
  __esModule: true,
  default: jest.fn(() => ({})),
}))

const routes: Route[] = [
  routeFactory.build({ id: "1", name: "1" }),
  routeFactory.build({ id: "28", name: "28" }),
  routeFactory.build({ id: "743", name: "SL3" }),
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

jest.mock("../../src/hooks/useAlerts")
jest.mock("../../src/hooks/useDetours")

beforeEach(() => {
  jest.mocked(useActiveDetours).mockReturnValue({})
  jest.mocked(useAlerts).mockReturnValue({})
})

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

  describe("alert icon on a route ladder", () => {
    test("renders with a non-skate detour", () => {
      jest
        .mocked(useTimepoints)
        .mockImplementationOnce(() => timepointsByRouteId)
      jest.mocked(useAlerts).mockReturnValue({ 28: [], 1: ["Route 1 detour"] })

      render(
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

      expect(routeAlert.get()).toBeVisible()
    })

    test("renders with a skate detour", () => {
      jest
        .mocked(useTimepoints)
        .mockImplementationOnce(() => timepointsByRouteId)
      jest.mocked(useActiveDetours).mockReturnValue({
        "1": simpleDetourFactory.build({ id: 1, route: "28" }),
        "2": simpleDetourFactory.build({ id: 2, route: "28" }),
      })

      render(
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

      expect(routeAlert.get()).toBeVisible()
    })

    test("renders with a skate detour on a route where route name and id don't match", () => {
      jest
        .mocked(useTimepoints)
        .mockImplementationOnce(() => timepointsByRouteId)
      jest.mocked(useActiveDetours).mockReturnValue({
        "1": simpleDetourFactory.build({ id: 1, route: "SL3" }),
        "2": simpleDetourFactory.build({ id: 2, route: "SL3" }),
      })

      render(
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

      expect(routeAlert.get()).toBeVisible()
    })

    test("doesn't render without an active detour", () => {
      jest
        .mocked(useTimepoints)
        .mockImplementationOnce(() => timepointsByRouteId)

      render(
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

      expect(routeAlert.query()).not.toBeInTheDocument()
    })
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
