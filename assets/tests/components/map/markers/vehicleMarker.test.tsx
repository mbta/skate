import { describe, test, expect } from "@jest/globals"

import React, { PropsWithChildren } from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"

import { VehicleMarker } from "../../../../src/components/map/markers/vehicleMarker"

import { vehicleFactory } from "../../../factories/vehicle"
import { MapContainer } from "react-leaflet"

const TestMap = ({ children }: PropsWithChildren): React.JSX.Element => (
  <MapContainer
    center={[0, 0]}
    zoom={13}
    maxBounds={[
      [41.2, -72],
      [43, -69.8],
    ]}
  >
    {children}
  </MapContainer>
)

describe("VehicleMarker", () => {
  test("Includes icon and label", () => {
    const { container } = render(
      <VehicleMarker
        vehicle={vehicleFactory.build({
          runId: "101",
        })}
        isPrimary={true}
      />,
      {
        wrapper: TestMap,
      }
    )
    expect(container.querySelector(".c-vehicle-map__icon")).toBeInTheDocument()
    expect(screen.getByText("101")).toBeInTheDocument()
  })
})
