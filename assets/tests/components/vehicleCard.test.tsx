import React from "react"
import { render } from "@testing-library/react"
import "@testing-library/jest-dom"
import { Vehicle } from "../../src/realtime"
import { Route } from "../../src/schedule"
import * as dateTime from "../../src/util/dateTime"
import vehicleFactory from "../factories/vehicle"
import routeFactory from "../factories/route"

import userEvent from "@testing-library/user-event"
import VehicleCard from "../../src/components/vehicleCard"
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

describe("VehicleCard", () => {
  test("displays information about the vehicle", () => {
    ;(useNearestIntersection as jest.Mock).mockImplementationOnce(
      () => intersection
    )
    const result = render(
      <RoutesProvider routes={[route]}>
        <VehicleCard vehicle={vehicle} onClose={jest.fn()} />
      </RoutesProvider>
    )

    expect(result.getByText("Outbound")).toBeInTheDocument()
    expect(result.getByText("39_X")).toBeInTheDocument()
    expect(result.getByText("Forest Hills")).toBeInTheDocument()
    expect(result.getByText("Current Location")).toBeInTheDocument()
    expect(result.getByText(intersection)).toBeInTheDocument()
    expect(result.getByText("111s ago")).toBeInTheDocument()
  })

  test("location not displayed if not known", () => {
    const result = render(<VehicleCard vehicle={vehicle} onClose={jest.fn()} />)

    ;(useNearestIntersection as jest.Mock).mockImplementationOnce(() => null)

    expect(result.queryByText("Current Location")).not.toBeInTheDocument()
  })

  test("clicking close button calls on close", async () => {
    const mockOnClose = jest.fn()
    const result = render(
      <VehicleCard vehicle={vehicle} onClose={mockOnClose} />
    )
    await userEvent.click(result.getByTitle("Close"))

    expect(mockOnClose).toHaveBeenCalled()
  })

  test("has link to street view", async () => {
    const result = render(<VehicleCard vehicle={vehicle} onClose={jest.fn()} />)

    expect(
      result.getByRole("link", { name: "Go to Street View" })
    ).toBeInTheDocument()
  })
})
