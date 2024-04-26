import { jest, describe, test, expect } from "@jest/globals"
import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"
import * as dateTime from "../../../src/util/dateTime"
import vehicleFactory, { shuttleFactory } from "../../factories/vehicle"
import routeFactory from "../../factories/route"
import VehiclePropertiesCard from "../../../src/components/mapPage/vehiclePropertiesCard"
import { useNearestIntersection } from "../../../src/hooks/useNearestIntersection"
import { RoutesProvider } from "../../../src/contexts/routesContext"
import ghostFactory from "../../factories/ghost"
import { runIdFactory } from "../../factories/run"
import userEvent from "@testing-library/user-event"

jest.mock("../../../src/hooks/useNearestIntersection", () => ({
  __esModule: true,
  useNearestIntersection: jest.fn(() => {
    return { is_loading: true }
  }),
}))

jest.mock("userTestGroups", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}))

describe("<VehiclePropertiesCard/>", () => {
  describe("logic constraints", () => {
    test("when rerendered, should display latest intersection", () => {
      const vehicle = vehicleFactory.build()
      const intersection = "Massachusetts Ave @ 1"
      const intersection2 = "Massachusetts Ave @ 2"
      ;jest.mocked(useNearestIntersection)
        .mockReturnValueOnce({ ok: intersection })
        .mockReturnValueOnce({ ok: intersection2 })

      const { rerender } = render(
        <VehiclePropertiesCard vehicleOrGhost={vehicle} />
      )
      const locationElement = screen.getByRole("status", {
        name: "Current Location",
      })

      expect(locationElement).toHaveTextContent(intersection)

      rerender(<VehiclePropertiesCard vehicleOrGhost={vehicle} />)

      expect(locationElement).toHaveTextContent(intersection2)
    })

    test("when rerendered, should display latest data", () => {
      const [vehicle, vehicle2] = vehicleFactory.buildList(2)

      const { rerender } = render(
        <VehiclePropertiesCard vehicleOrGhost={vehicle} />
      )
      const runCell = screen.getByRole("cell", { name: /run/i })
      const vehicleCell = screen.getByRole("cell", { name: /vehicle/i })

      expect(runCell).toHaveTextContent(vehicle.runId!)
      expect(vehicleCell).toHaveTextContent(vehicle.label!)

      rerender(<VehiclePropertiesCard vehicleOrGhost={vehicle2} />)

      expect(vehicleCell).toHaveTextContent(vehicle2.label!)
      expect(runCell).toHaveTextContent(vehicle2.runId!)
    })

    test("should fire onRouteVariantName when route text button clicked", async () => {
      const vehicle = vehicleFactory.build()
      const event = jest.fn()

      render(
        <VehiclePropertiesCard
          vehicleOrGhost={vehicle}
          onRouteVariantNameClicked={event}
        />
      )

      await userEvent.click(
        screen.getByRole("button", { name: "Route Variant Name" })
      )

      expect(event).toHaveBeenCalledTimes(1)
    })
  })

  describe("bus types and data scenarios rendering", () => {
    describe("vehicle default, not invalid or ghost", () => {
      test("has location available, should render all design fields", () => {
        jest.spyOn(Date, "now").mockReturnValue(234000)
        jest
          .spyOn(dateTime, "now")
          .mockReturnValue(new Date("2018-08-15T17:41:21.000Z"))

        const vehicle = vehicleFactory.build()
        const route = routeFactory.build({
          id: vehicle.routeId!,
          name: vehicle.routeId!,
        })

        const intersection = "Massachusetts Ave @ Marlborough St"
        ;jest.mocked(useNearestIntersection).mockReturnValueOnce({
          ok: intersection,
        })

        render(
          <RoutesProvider routes={[route]}>
            <VehiclePropertiesCard vehicleOrGhost={vehicle} />
          </RoutesProvider>
        )
        // -- Assert
        expect(
          screen.getByRole("generic", { name: /vehicle properties card/i })
        ).toBeVisible()

        // - Header Bar
        expect(
          screen.getByRole("status", { name: /Last Update/i })
        ).toHaveTextContent("Updated 111 sec ago")

        // - Vehicle Route Summary
        // Vehicle Icon
        expect(
          screen.getByRole("img", { name: /vehicle status icon/i })
        ).toBeVisible()

        expect(
          screen.getByRole("status", { name: /Vehicle Schedule Adherence/i })
        ).toHaveTextContent(/on time \(0 min early\)/i)
        expect(
          screen.getByRole("status", { name: "Route Direction" })
        ).toHaveTextContent(/outbound/i)
        expect(
          screen.getByRole("status", { name: "Route Variant Name" })
        ).toHaveTextContent("39_X Forest Hills")

        // - Vehicle Work Info
        const { operatorFirstName, operatorLastName, operatorId } = vehicle
        // Run      | Run ID
        expect(screen.getByRole("cell", { name: /run/ })).toHaveTextContent(
          vehicle.runId!
        )
        // Vehicle  | Vehicle ID
        expect(screen.getByRole("cell", { name: /vehicle/ })).toHaveTextContent(
          vehicle.label!
        )
        // Operator | Operator First, Last, #BadgeID
        const operator = screen.getByRole("cell", { name: /operator/ })
        expect(operator).toHaveTextContent(
          new RegExp(
            `${operatorFirstName} ${operatorLastName} #${operatorId}`,
            "i"
          )
        )
        expect(operator).toHaveClass("fs-mask")

        // - Vehicle Location Information
        expect(
          screen.getByRole("status", { name: "Current Location" })
        ).toHaveTextContent(intersection)
        expect(
          screen.getByRole("link", { name: /directions to bus/i })
        ).toBeVisible()
      })

      test("renders last updated differently when more than 5 minutes in the past", () => {
        jest.spyOn(Date, "now").mockReturnValue(483000)

        const vehicle = vehicleFactory.build({
          timestamp: 123,
        })
        const route = routeFactory.build({
          id: vehicle.routeId!,
          name: vehicle.routeId!,
        })

        const intersection = "Massachusetts Ave @ Marlborough St"
        ;jest.mocked(useNearestIntersection).mockReturnValueOnce({
          ok: intersection,
        })

        render(
          <RoutesProvider routes={[route]}>
            <VehiclePropertiesCard vehicleOrGhost={vehicle} />
          </RoutesProvider>
        )

        expect(
          screen.getByRole("status", { name: /Last Update/i })
        ).toHaveTextContent("Updated at 12:02 AM; 1/01/1970")
      })

      test("when location is initially loading, should show `loading...` backup text", () => {
        const vehicle = vehicleFactory.build()
        ;jest.mocked(useNearestIntersection).mockReturnValueOnce({
          is_loading: true,
        })

        render(<VehiclePropertiesCard vehicleOrGhost={vehicle} />)

        expect(
          screen.getByRole("status", { name: "Current Location" })
        ).toHaveTextContent("loading...")
      })

      test("when location not available, should show `exact location cannot be determined` backup text", () => {
        const vehicle = vehicleFactory.build()
        ;jest.mocked(useNearestIntersection).mockReturnValueOnce({
          is_error: true,
        })

        render(<VehiclePropertiesCard vehicleOrGhost={vehicle} />)

        expect(
          screen.getByRole("status", { name: "Current Location" })
        ).toHaveTextContent("Exact location cannot be determined")
      })

      test("when location is loading a new vehicle, should show loading text", () => {
        const vehicle = vehicleFactory.build()
        const intersection = "intersection ave @ street"
        ;jest.mocked(useNearestIntersection)
          .mockReturnValueOnce({ is_loading: true })
          .mockReturnValueOnce({ ok: intersection })

        render(<VehiclePropertiesCard vehicleOrGhost={vehicle} />)
        const currentLocation = screen.getByRole("status", {
          name: "Current Location",
        })

        expect(currentLocation).toHaveTextContent("loading...")

        waitFor(
          () => {
            expect(currentLocation).toHaveTextContent(intersection)
          },
          { timeout: 2 }
        )
      })
    })

    test("vehicle is off course, should render invalid bus design", () => {
      const vehicle = vehicleFactory.build({ isOffCourse: true })

      render(<VehiclePropertiesCard vehicleOrGhost={vehicle} />)

      // Show `invalid` in Adherence Info
      expect(
        screen.getByRole("status", { name: /Vehicle Schedule Adherence/i })
      ).toHaveTextContent(/invalid/i)

      // Use correct icon // TODO: make accessible and ensure icon is correct
      expect(
        screen.getByRole("img", { name: /vehicle status icon/i })
      ).toBeVisible()
    })

    test("vehicle is shuttle, should render shuttle text and no route or adherence info", () => {
      const vehicle = shuttleFactory.build()

      render(<VehiclePropertiesCard vehicleOrGhost={vehicle} />)

      expect(
        screen.getByRole("status", { name: /Route Variant Name/i })
      ).toHaveTextContent("Shuttle")
      expect(
        screen.getByRole("status", { name: /Route Direction/i })
      ).toBeEmptyDOMElement()
      expect(
        screen.getByRole("status", { name: /Vehicle Schedule Adherence/i })
      ).toBeEmptyDOMElement()

      // Use correct icon // TODO: make accessible and ensure icon is correct
      expect(
        screen.getByRole("img", { name: /vehicle status icon/i })
      ).toBeVisible()
    })

    test("vehicle is logged out, should render special text in missing data fields", () => {
      const vehicle = vehicleFactory.build({
        operatorLogonTime: null,
        operatorFirstName: null,
        operatorLastName: null,
        operatorId: null,
        runId: null,
        blockId: undefined,
      })

      render(<VehiclePropertiesCard vehicleOrGhost={vehicle} />)

      expect(
        screen.getByRole("status", { name: /Route Variant Name/i })
      ).toHaveTextContent("Logged Off")
      expect(
        screen.getByRole("status", { name: /Route Direction/i })
      ).toHaveTextContent("No direction available")

      expect(screen.getByRole("cell", { name: /run/ })).toHaveTextContent(
        "No run logged in"
      )
      expect(screen.getByRole("cell", { name: /operator/ })).toHaveTextContent(
        "No operator logged in"
      )
    })

    test("vehicle is pulling back, should render pull-back information", () => {
      const vehicle = vehicleFactory.build({
        endOfTripType: "pull_back",
        stopStatus: { stopId: null, stopName: null },
        pullbackPlaceName: "Some Garage",
      })

      render(<VehiclePropertiesCard vehicleOrGhost={vehicle} />)

      expect(
        screen.getByRole("status", { name: /Route Variant Name/i })
      ).toHaveTextContent("Some Garage")
      expect(
        screen.getByRole("status", { name: /Route Direction/i })
      ).toHaveTextContent("Pulling back")
      expect(
        screen.getByRole("status", { name: /Vehicle Schedule Adherence/i })
      ).toHaveTextContent(/logged in/i)
    })

    // - Ghost Bus is not Displayable on map
    test("vehicle is ghost bus, should render ghost bus design", () => {
      // Display "Ghost Bus or Dropped Trip" in `LastUpdated`
      // Do not Display the location information block
      // Display `N/A` in invalid labels
      // Display Ghost Icon and `N/A`
      // Do not display adherence information
      const ghost = ghostFactory.build({
        runId: runIdFactory.build(),
      })
      const route = routeFactory.build({
        id: ghost.routeId!,
        name: ghost.routeId!,
      })

      const intersection = "Massachusetts Ave @ Marlborough St"
      ;jest.mocked(useNearestIntersection).mockReturnValueOnce({
        ok: intersection,
      })

      render(
        <RoutesProvider routes={[route]}>
          <VehiclePropertiesCard vehicleOrGhost={ghost} />
        </RoutesProvider>
      )

      // -- Assert
      expect(
        screen.getByRole("generic", { name: /vehicle properties card/i })
      ).toBeVisible()

      // - Header Bar
      expect(
        screen.getByRole("status", { name: /Last Update/i })
      ).toHaveTextContent(/ghost bus or dropped trip/i)

      // - Vehicle Route Summary
      // Vehicle Icon
      expect(
        screen.getByRole("img", { name: /vehicle status icon/i })
      ).toBeVisible()

      expect(
        screen.getByRole("status", { name: /Vehicle Schedule Adherence/i })
      ).toBeEmptyDOMElement()
      expect(
        screen.getByRole("status", { name: "Route Direction" })
      ).toHaveTextContent(/outbound/i)
      expect(
        screen.getByRole("status", { name: "Route & Variant" })
      ).toHaveTextContent(ghost.routeId)
      expect(
        screen.getByRole("status", { name: "Headsign" })
      ).toHaveTextContent(ghost.headsign)

      // - Vehicle Work Info
      // const { operatorFirstName, operatorLastName, operatorId } = ghost
      // Run      | Run ID
      expect(screen.getByRole("cell", { name: /run/ })).toHaveTextContent(
        ghost.runId!
      )
      // Vehicle  | Vehicle ID
      expect(screen.getByRole("cell", { name: /vehicle/ })).toHaveTextContent(
        "N/A"
      )
      // Operator | Operator First, Last, #BadgeID
      const operator = screen.getByRole("cell", { name: /operator/ })
      expect(operator).toHaveTextContent("N/A")

      // - Vehicle Location Information
      expect(
        screen.getByRole("status", { name: "Current Location", hidden: true })
      ).not.toBeVisible()
      expect(
        screen.queryByRole("link", { name: /street view/i, hidden: true })
      ).not.toBeInTheDocument()
    })
  })
})
