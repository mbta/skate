import { describe, test, expect, jest } from "@jest/globals"
import React from "react"
import { render, screen } from "@testing-library/react"
import StaleDataPropertiesPanel from "../../../src/components/propertiesPanel/staleDataPropertiesPanel"
import vehicleFactory from "../../factories/vehicle"
import blockWaiverFactory from "../../factories/blockWaiver"
import {
  useMinischeduleBlock,
  useMinischeduleRun,
} from "../../../src/hooks/useMinischedule"
import userEvent from "@testing-library/user-event"
import { TabMode } from "../../../src/components/propertiesPanel/tabPanels"
import { closeButton } from "../../testHelpers/selectors/components/closeButton"

jest.mock("../../../src/hooks/useMinischedule")

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

  test("calls closePanel callback on close", async () => {
    const vehicle = vehicleFactory.build()
    const mockClosePanel = jest.fn()

    render(
      <StaleDataPropertiesPanel
        selectedVehicle={vehicle}
        tabMode="status"
        setTabMode={jest.fn()}
        closePanel={mockClosePanel}
      />
    )

    await userEvent.click(closeButton.get())

    expect(mockClosePanel).toHaveBeenCalled()
  })

  test.each<{ tab: TabMode; clickTarget: string; initialTab?: TabMode }>([
    { tab: "run", clickTarget: "Run" },
    { tab: "block", clickTarget: "Block" },
    { tab: "status", clickTarget: "Status", initialTab: "block" },
  ])(
    "when active tab changes to '$tab', calls tab change callback",
    async ({ tab, clickTarget, initialTab }) => {
      jest.mocked(useMinischeduleRun).mockReturnValue(undefined)
      jest.mocked(useMinischeduleBlock).mockReturnValue(undefined)

      const mockSetTabMode = jest.fn()

      render(
        <StaleDataPropertiesPanel
          selectedVehicle={vehicleFactory.build()}
          tabMode={initialTab || "status"}
          setTabMode={mockSetTabMode}
          closePanel={jest.fn()}
        />
      )

      await userEvent.click(screen.getByRole("tab", { name: clickTarget }))

      expect(mockSetTabMode).toHaveBeenCalledWith(tab)
    }
  )
})
