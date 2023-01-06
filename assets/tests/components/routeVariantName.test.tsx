import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import routeFactory from "../factories/route"
import {
  RouteVariantName,
} from "../../src/components/routeVariantName"
import { RoutesProvider } from "../../src/contexts/routesContext"
import { Route } from "../../src/schedule"
import vehicleFactory from "../factories/vehicle"

describe("RouteVariantName", () => {
  test("renders for a vehicle with variant and headsign", () => {
    const vehicle = vehicleFactory.build()

    render(<RouteVariantName vehicle={vehicle} />)

    expect(
      screen.getByRole("status", { name: "Route Variant Name" })
    ).toHaveTextContent("39_X Forest Hills")
  })

  test("renders for a vehicle missing variant and headsign", () => {
    const testVehicle = vehicleFactory.build({
      headsign: null,
      viaVariant: null,
    })

    render(<RouteVariantName vehicle={testVehicle} />)

    expect(
      screen.getByRole("status", { name: "Route Variant Name" })
    ).toHaveTextContent("39_")
  })

  test("doesn't show underscore variant character", () => {
    const testVehicle = vehicleFactory.build({
      headsign: null,
      viaVariant: "_",
    })

    render(<RouteVariantName vehicle={testVehicle} />)

    expect(
      screen.getByRole("status", { name: "Route Variant Name" })
    ).toHaveTextContent("39_")
  })

  test("renders a static label for a shuttle", () => {
    const testVehicle = vehicleFactory.build({
      isShuttle: true,
    })

    render(<RouteVariantName vehicle={testVehicle} />)

    expect(screen.getByText("Shuttle")).toBeInTheDocument()
  })

  test("uses route name if available", () => {
    const vehicle = vehicleFactory.build()
    const route: Route = routeFactory.build({
      id: "39",
      name: "ThirtyNine",
    })

    render(
      <RoutesProvider routes={[route]}>
        <RouteVariantName vehicle={vehicle} />
      </RoutesProvider>
    )

    expect(
      screen.getByRole("status", { name: "Route Variant Name" })
    ).toHaveTextContent("ThirtyNine_X Forest Hills")
  })
})
