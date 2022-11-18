import React from "react"
import { render } from "@testing-library/react"
import "@testing-library/jest-dom"
import { Vehicle } from "../../src/realtime"
import { Route } from "../../src/schedule"
import * as dateTime from "../../src/util/dateTime"
import vehicleFactory from "../factories/vehicle"
import routeFactory from "../factories/route"

import { useNearestIntersection } from "../../src/hooks/useNearestIntersection"
import { RoutesProvider } from "../../src/contexts/routesContext"
import LiveVehicleCard from "../../src/components/liveVehicleCard"
import useVehicleForId from "../../src/hooks/useVehicleForId"
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

jest.mock("../../src/hooks/useVehicleForId", () => ({
  __esModule: true,
  default: jest.fn(),
}))

describe("LiveVehicleCard", () => {
  test("null when no live vehicle data", () => {
    ;(useNearestIntersection as jest.Mock).mockImplementationOnce(
      () => intersection
    )
    const result = render(
      <RoutesProvider routes={[route]}>
        <LiveVehicleCard vehicle={vehicle} onClose={jest.fn()} />
      </RoutesProvider>
    )
    expect(result.queryByText("Forest Hills")).not.toBeInTheDocument()
  })

  test("uses live vehicle data when available", () => {
    ;(useVehicleForId as jest.Mock).mockImplementationOnce(() => ({
      ...vehicle,
      headsign: "Andrew",
    }))
    const result = render(
      <RoutesProvider routes={[route]}>
        <LiveVehicleCard vehicle={vehicle} onClose={jest.fn()} />
      </RoutesProvider>
    )
    expect(result.queryByText("Andrew")).toBeInTheDocument()
  })
})
