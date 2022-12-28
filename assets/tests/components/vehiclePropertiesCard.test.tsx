import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { Vehicle } from "../../src/realtime"
import { Route } from "../../src/schedule"
import * as dateTime from "../../src/util/dateTime"
import vehicleFactory from "../factories/vehicle"
import routeFactory from "../factories/route"

import userEvent from "@testing-library/user-event"
import VehiclePropertiesCard from "../../src/components/vehiclePropertiesCard"
import { useNearestIntersection } from "../../src/hooks/useNearestIntersection"
import { RoutesProvider } from "../../src/contexts/routesContext"
jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("2018-08-15T17:41:21.000Z"))

jest.spyOn(Date, "now").mockImplementation(() => 234000)

const route: Route = routeFactory.build({ id: "39", name: "39" })
const vehicle: Vehicle = vehicleFactory.build({ routeId: "39" })

const intersection = "Massachusetts Ave @ Marlborough St"
jest.mock("../../src/hooks/useNearestIntersection", () => ({
  __esModule: true,
  useNearestIntersection: jest.fn(() => null),
}))

describe("VehiclePropertiesCard", () => {
  describe("todo: card interactions", () => {
    test.todo("The VPC can be closed by clicking the 'X' button. (kinda done)")
    test.todo("Selecting another vehicle does not render old data")
    test.todo("Selecting another vehicle renders with new information")
    test.todo("when vehicle prop changes, card rerenders?")
  })
  // The information displayed in the VPC, outlined in the Figma file,
  // corresponds with the selected vehicle, following guidelines for component
  // variants (default, no location data available, invalid bus, ghost bus).
  describe("renders bus information according to the figma file", () => {
    test.todo("Default > Location Available") // {
    // Header
    // Vehicle Summary
    // "Vehicle Status"
    // Location Information
    // }
    test.todo("Default > Location Not Available") // {
    // shows "Exact location cannot be determined" when unavailable
    // }
    test.todo("Invalid Bus") // {
    // Show invalid in Adherence Info
    // Use correct icon
    // }
    test.todo("Ghost Bus") // {
    // Display "Ghost Bus or Dropped Trip" in `LastUpdated`
    // Do not Display the location information block
    // Display `N/A` in invalid labels
    // Display Ghost Icon and `N/A`
    // Do not display adherence information
    // }
  })
  test("displays information about the vehicle", () => {
    ;(useNearestIntersection as jest.Mock).mockImplementationOnce(
      () => intersection
    )
    render(
      <RoutesProvider routes={[route]}>
        <VehiclePropertiesCard vehicle={vehicle} onClose={jest.fn()} />
      </RoutesProvider>
    )

    expect(screen.getByText("Outbound")).toBeInTheDocument()
    expect(screen.getByText("39_X")).toBeInTheDocument()
    expect(screen.getByText("Forest Hills")).toBeInTheDocument()
    expect(screen.getByText("Current Location")).toBeInTheDocument()
    expect(screen.getByText(intersection)).toBeInTheDocument()
    expect(screen.getByText("111s ago")).toBeInTheDocument()
  })

  test("location not displayed if not known", () => {
    render(<VehiclePropertiesCard vehicle={vehicle} onClose={jest.fn()} />)

    ;(useNearestIntersection as jest.Mock).mockImplementationOnce(() => null)

    expect(screen.queryByText("Current Location")).not.toBeInTheDocument()
  })

  // Alt Name: Figma: The VPC can be closed by clicking the 'X' button.
  test("clicking close button calls on close", async () => {
    const mockOnClose = jest.fn()
    render(
      <VehiclePropertiesCard vehicle={vehicle} onClose={mockOnClose} />
    )
    await userEvent.click(screen.getByTitle("Close"))

    expect(mockOnClose).toHaveBeenCalled()
  })

  test("has link to street view", async () => {
    render(<VehiclePropertiesCard vehicle={vehicle} onClose={jest.fn()} />)

    expect(
      screen.getByRole("link", { name: "Go to Street View" })
    ).toBeInTheDocument()
  })
})
