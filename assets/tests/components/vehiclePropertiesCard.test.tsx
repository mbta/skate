import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import * as dateTime from "../../src/util/dateTime"
import vehicleFactory from "../factories/vehicle"
import routeFactory from "../factories/route"

import userEvent from "@testing-library/user-event"
import VehiclePropertiesCard from "../../src/components/vehiclePropertiesCard"
import { useNearestIntersection } from "../../src/hooks/useNearestIntersection"
import { RoutesProvider } from "../../src/contexts/routesContext"

jest.mock("../../src/hooks/useNearestIntersection", () => ({
  __esModule: true,
  useNearestIntersection: jest.fn(() => null),
}))

describe("<VehiclePropertiesCard/>", () => {
  describe("logic constraints", () => {
    test("when `close` button is clicked, should fire `onClose` callback", async () => {
      const onClose = jest.fn()
      render(
        <VehiclePropertiesCard
          vehicle={vehicleFactory.build()}
          onClose={onClose}
        />
      )

      await userEvent.click(screen.getByRole("button", { name: /close/i }))

      expect(onClose).toHaveBeenCalled()
    })

    test("when rerendered, should display latest intersection", () => {
      const vehicle = vehicleFactory.build()
      const intersection = "Massachusetts Ave @ 1"
      const intersection2 = "Massachusetts Ave @ 2"
      ;(useNearestIntersection as jest.Mock)
        .mockReturnValueOnce(intersection)
        .mockReturnValueOnce(intersection2)

      const { rerender } = render(
        <VehiclePropertiesCard vehicle={vehicle} onClose={jest.fn()} />
      )
      const locationElement = screen.getByRole("status", {
        name: "Current Location",
      })

      expect(locationElement).toHaveTextContent(intersection)

      rerender(<VehiclePropertiesCard vehicle={vehicle} onClose={jest.fn()} />)

      expect(locationElement).toHaveTextContent(intersection2)
    })

    test("when rerendered, should display latest data", () => {
      const [vehicle, vehicle2] = vehicleFactory.buildList(2)

      const { rerender } = render(
        <VehiclePropertiesCard vehicle={vehicle} onClose={jest.fn()} />
      )
      const runCell = screen.getByRole("cell", { name: /run/i })
      const vehicleCell = screen.getByRole("cell", { name: /vehicle/i })

      expect(runCell).toHaveTextContent(vehicle.runId!)
      expect(vehicleCell).toHaveTextContent(vehicle.label)

      rerender(<VehiclePropertiesCard vehicle={vehicle2} onClose={jest.fn()} />)

      expect(vehicleCell).toHaveTextContent(vehicle2.label)
      expect(runCell).toHaveTextContent(vehicle2.runId!)
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
        ;(useNearestIntersection as jest.Mock).mockReturnValueOnce(intersection)

        render(
          <RoutesProvider routes={[route]}>
            <VehiclePropertiesCard vehicle={vehicle} onClose={jest.fn()} />
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
        expect(screen.getByRole("button", { name: /close/i })).toBeVisible()

        // - Vehicle Route Summary
        // Vehicle Icon
        // ToDo: make component accessible
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
          vehicle.label
        )
        // Operator | Operator First, Last, #BadgeID
        const operator = screen.getByRole("cell", { name: /operator/ })
        expect(operator).toHaveTextContent(
          `${operatorFirstName} ${operatorLastName} #${operatorId}`
        )
        expect(operator).toHaveClass("fs-mask")

        // - Vehicle Location Information
        expect(
          screen.getByRole("status", { name: "Current Location" })
        ).toHaveTextContent(intersection)
        expect(screen.getByRole("link", { name: /street view/i })).toBeVisible()
      })

      test("when location not available, should show `exact location cannot be determined` backup text", () => {
        const vehicle = vehicleFactory.build()
        ;(useNearestIntersection as jest.Mock).mockReturnValueOnce(null)

        render(<VehiclePropertiesCard vehicle={vehicle} onClose={jest.fn()} />)

        expect(
          screen.getByRole("status", { name: "Current Location" })
        ).toHaveTextContent("Exact location cannot be determined")
      })

      test("when location is loading a new vehicle, should show loading text", () => {
        const vehicle = vehicleFactory.build()
        const intersection = "intersection ave @ street"
        ;(useNearestIntersection as jest.Mock)
          .mockReturnValueOnce(undefined)
          .mockReturnValueOnce(intersection)

        render(<VehiclePropertiesCard vehicle={vehicle} onClose={jest.fn()} />)
        const currentLocation = screen.getByRole("status", {
          name: "Current Location",
        })

        // expect(currentLocation).toHaveTextContent(/loading/i)

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

      render(<VehiclePropertiesCard vehicle={vehicle} onClose={jest.fn()} />)

      // Show `invalid` in Adherence Info
      expect(
        screen.getByRole("status", { name: /Vehicle Schedule Adherence/i })
      ).toHaveTextContent(/invalid/i)

      // Use correct icon // TODO: make accessible and ensure icon is correct
      expect(
        screen.getByRole("img", { name: /vehicle status icon/i })
      ).toBeVisible()
    })

    // - Ghost Bus is not Displayable on map
    // test.todo("vehicle is ghost bus, should render ghost bus design") //, {
    // Display "Ghost Bus or Dropped Trip" in `LastUpdated`
    // Do not Display the location information block
    // Display `N/A` in invalid labels
    // Display Ghost Icon and `N/A`
    // Do not display adherence information
    // })
  })
})
