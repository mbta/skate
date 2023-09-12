import { describe, test, expect, jest } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import { render, screen } from "@testing-library/react"
import React from "react"

import { VehicleRouteSummary } from "../../src/components/vehicleRouteSummary"
import { RoutesProvider } from "../../src/contexts/routesContext"
import ghostFactory from "../factories/ghost"
import routeFactory from "../factories/route"
import vehicleFactory, {
  invalidVehicleFactory,
  shuttleFactory,
} from "../factories/vehicle"

describe("<VehicleRouteSummary />", () => {
  describe("when rendering", () => {
    test("a valid vehicle on route, should render direction, route variant, headsign, and icon", () => {
      const route = routeFactory.build()
      const vehicle = vehicleFactory.build({ routeId: route.id })

      render(
        <RoutesProvider routes={[route]}>
          <VehicleRouteSummary vehicle={vehicle} />
        </RoutesProvider>
      )

      expect(
        screen.getByRole("status", { name: "Route Direction" })
      ).toHaveTextContent(/outbound/i)

      const routeVariantName = screen.getByRole("status", {
        name: "Route Variant Name",
      })
      expect(routeVariantName).toHaveTextContent(route.name)
      expect(routeVariantName).toHaveTextContent(vehicle.viaVariant!)
      expect(routeVariantName).toHaveTextContent(vehicle.headsign!)

      expect(
        screen.getByRole("img", { name: /vehicle status icon/i })
      ).toBeVisible()
    })

    test("a shuttle, should show shuttle text, and should not show route", () => {
      const route = routeFactory.build()
      const vehicle = shuttleFactory.build()

      render(
        <RoutesProvider routes={[route]}>
          <VehicleRouteSummary vehicle={vehicle} />
        </RoutesProvider>
      )

      expect(
        screen.getByRole("status", { name: /Route Variant Name/i })
      ).toHaveTextContent("Shuttle")

      expect(
        screen.getByRole("status", { name: /Route Direction/i })
      ).toBeEmptyDOMElement()

      expect(
        screen.getByRole("img", { name: /vehicle status icon/i })
      ).toBeVisible()
    })

    test("a logged out vehicle should alternate text for fields not available", () => {
      const vehicle = vehicleFactory.build({
        operatorLogonTime: null,
        runId: null,
        blockId: undefined,
      })

      render(
        <RoutesProvider routes={[]}>
          <VehicleRouteSummary vehicle={vehicle} />
        </RoutesProvider>
      )

      expect(
        screen.getByRole("status", { name: /Route Variant Name/i })
      ).toHaveTextContent("Logged Off")

      expect(
        screen.getByRole("status", { name: /Route Direction/i })
      ).toHaveTextContent("No direction available")

      expect(
        screen.getByRole("img", { name: /vehicle status icon/i })
      ).toBeVisible()
    })

    test("an off course vehicle, should show direction and route variant name", () => {
      const route = routeFactory.build()
      const vehicle = invalidVehicleFactory.build({ routeId: route.id })

      render(
        <RoutesProvider routes={[route]}>
          <VehicleRouteSummary vehicle={vehicle} />
        </RoutesProvider>
      )

      expect(
        screen.getByRole("status", { name: /Route Variant Name/i })
      ).toHaveTextContent(route.name)
      expect(
        screen.getByRole("status", { name: /Route Variant Name/i })
      ).toHaveTextContent(vehicle.headsign!)

      expect(
        screen.getByRole("status", { name: /Route Direction/i })
      ).toHaveTextContent(/outbound/i)

      expect(
        screen.getByRole("img", { name: /vehicle status icon/i })
      ).toBeVisible()
    })

    test("a pulling back vehicle, should show pull back information when flag is set", () => {
      const vehicle = vehicleFactory.build({
        endOfTripType: "pull_back",
        stopStatus: { stopId: null, stopName: null },
        pullbackPlaceName: "Some Garage",
      })

      render(
        <VehicleRouteSummary
          vehicle={vehicle}
          includePullbackInformation={true}
          onRouteVariantNameClicked={jest.fn()}
        />
      )

      expect(
        screen.getByRole("status", { name: /Route Variant Name/i })
      ).toHaveTextContent(vehicle.pullbackPlaceName!)

      // pullback location shouldn't be clickable like a route variant is
      expect(screen.queryByRole("button")).not.toBeInTheDocument()

      expect(
        screen.getByRole("status", { name: /Route Direction/i })
      ).toHaveTextContent(/pulling back/i)

      expect(
        screen.getByRole("img", { name: /vehicle status icon/i })
      ).toBeVisible()
    })

    test("a ghost bus, should show direction and route variant name", () => {
      const route = routeFactory.build()
      const ghost = ghostFactory.build({ routeId: route.id })

      render(
        <RoutesProvider routes={[route]}>
          <VehicleRouteSummary vehicle={ghost} />
        </RoutesProvider>
      )

      expect(
        screen.getByRole("img", { name: /vehicle status icon/i })
      ).toHaveTextContent("N/A")

      expect(
        screen.getByRole("status", { name: /Route Direction/i })
      ).toHaveTextContent(/outbound/i)

      expect(
        screen.getByRole("status", { name: /Route Variant Name/i })
      ).toHaveTextContent(route.name)
      expect(
        screen.getByRole("status", { name: /Route Variant Name/i })
      ).toHaveTextContent(ghost.headsign!)
    })
  })
})
