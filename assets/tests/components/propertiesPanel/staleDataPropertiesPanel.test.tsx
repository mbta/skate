import { describe, test, expect, jest } from "@jest/globals"
import React from "react"
import { render } from "@testing-library/react"
import StaleDataPropertiesPanel from "../../../src/components/propertiesPanel/staleDataPropertiesPanel"
import vehicleFactory from "../../factories/vehicle"
import blockWaiverFactory from "../../factories/blockWaiver"

describe("StaleDataPropertiesPanel", () => {
  test("renders a stale non-shuttle vehicle", () => {
    const vehicle = vehicleFactory.build()

    const result = render(
      <StaleDataPropertiesPanel
        selectedVehicle={vehicle}
        tabMode="status"
        setTabMode={jest.fn()}
        closePanel={jest.fn()}
      />
    )

    expect(result.queryByText(/Status data is not available/)).not.toBeNull()
    expect(result.queryByText(/Run/)).not.toBeNull()
  })

  test("renders a stale non-shuttle vehicle with block waivers", () => {
    const vehicle = vehicleFactory.build({
      blockWaivers: [blockWaiverFactory.build()],
    })

    const result = render(
      <StaleDataPropertiesPanel
        selectedVehicle={vehicle}
        tabMode="status"
        setTabMode={jest.fn()}
        closePanel={jest.fn()}
      />
    )

    expect(result.queryByText(/problem/)).not.toBeNull()
  })

  test("renders a stale shuttle vehicle", () => {
    const vehicle = vehicleFactory.build({ isShuttle: true })

    const result = render(
      <StaleDataPropertiesPanel
        selectedVehicle={vehicle}
        tabMode="status"
        setTabMode={jest.fn()}
        closePanel={jest.fn()}
      />
    )

    expect(result.queryByText(/Status data is not available/)).not.toBeNull()
    expect(result.queryByText(/Run/)).toBeNull()
  })
})
