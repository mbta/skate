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
