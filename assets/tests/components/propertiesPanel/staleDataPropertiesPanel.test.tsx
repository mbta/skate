import React from "react"
import { render } from "@testing-library/react"
import StaleDataPropertiesPanel from "../../../src/components/propertiesPanel/staleDataPropertiesPanel"
import vehicleFactory from "../../factories/vehicle"

describe("StaleDataPropertiesPanel", () => {
  test("renders a stale non-shuttle vehicle", () => {
    const vehicle = vehicleFactory.build()

    const result = render(
      <StaleDataPropertiesPanel selectedVehicle={vehicle} />
    )

    expect(result.queryByText(/Status data is not available/)).not.toBeNull()
    expect(result.queryByText(/Run/)).not.toBeNull()
  })

  test("renders a stale shuttle vehicle", () => {
    const vehicle = vehicleFactory.build({ isShuttle: true })

    const result = render(
      <StaleDataPropertiesPanel selectedVehicle={vehicle} />
    )

    expect(result.queryByText(/Status data is not available/)).not.toBeNull()
    expect(result.queryByText(/Run/)).toBeNull()
  })
})
