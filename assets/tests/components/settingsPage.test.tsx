import { jest, describe, test, expect, beforeEach } from "@jest/globals"
import React from "react"
import { BrowserRouter } from "react-router-dom"
import { render, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"
import renderer from "react-test-renderer"
import SettingsPage from "../../src/components/settingsPage"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import {
  initialState,
  setLadderVehicleLabelSetting,
  setShuttleVehicleLabelSetting,
  setVehicleAdherenceColorsSetting,
} from "../../src/state"
import {
  defaultUserSettings,
  VehicleLabelSetting,
  VehicleAdherenceColorsSetting,
} from "../../src/userSettings"
import userEvent from "@testing-library/user-event"
import { useNearestIntersectionFetchResult } from "../../src/hooks/useNearestIntersection"
import { loading } from "../../src/util/fetchResult"

jest.mock("../../src/hooks/useNearestIntersection")

jest.mock("../../src/hooks/useShapes", () => ({
  __esModule: true,
  useTripShape: jest.fn(() => null),
}))

beforeEach(() => {
  jest.mocked(useNearestIntersectionFetchResult).mockReturnValue(loading())
})

const mockDispatch = jest.fn()

describe("SettingsPage", () => {
  test("renders", () => {
    const tree = renderer
      .create(
        <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
          <BrowserRouter>
            <SettingsPage />
          </BrowserRouter>
        </StateDispatchProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("displays the current ladder vehicle label setting", () => {
    const mockState = {
      ...initialState,
      userSettings: {
        ...defaultUserSettings,
        ladderVehicleLabel: VehicleLabelSetting.VehicleNumber,
      },
    }

    const result = render(
      <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(
      result.getByTestId("ladder-vehicle-label-vehicle-number")
    ).toBeChecked()
  })

  test("selecting a ladder vehicle label setting sets that value", async () => {
    const testDispatch = jest.fn()
    window.fetch = jest.fn<typeof window.fetch>()

    const result = render(
      <StateDispatchProvider state={initialState} dispatch={testDispatch}>
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await userEvent.click(
      result.getByTestId("ladder-vehicle-label-vehicle-number")
    )

    await waitFor(() =>
      expect(testDispatch).toHaveBeenCalledWith(
        setLadderVehicleLabelSetting(VehicleLabelSetting.VehicleNumber)
      )
    )
    // Updates the backend database
    expect(jest.mocked(window.fetch).mock.calls[0][0]).toEqual(
      "/api/user_settings?field=ladder_page_vehicle_label&value=vehicle_id"
    )
  })

  test("displays the current map vehicle label setting", () => {
    const mockState = {
      ...initialState,
      userSettings: {
        ...defaultUserSettings,
        shuttleVehicleLabel: VehicleLabelSetting.RunNumber,
      },
    }

    const result = render(
      <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )
    expect(result.getByTestId("shuttle-vehicle-label-run-number")).toBeChecked()
  })

  test("selecting a map vehicle label setting sets that value", async () => {
    const testDispatch = jest.fn()
    window.fetch = jest.fn<typeof window.fetch>()

    const result = render(
      <StateDispatchProvider state={initialState} dispatch={testDispatch}>
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await userEvent.click(
      result.getByTestId("shuttle-vehicle-label-run-number")
    )

    expect(testDispatch).toHaveBeenCalledWith(
      setShuttleVehicleLabelSetting(VehicleLabelSetting.RunNumber)
    )
    // Updates the backend database
    expect(jest.mocked(window.fetch).mock.calls[0][0]).toEqual(
      "/api/user_settings?field=shuttle_page_vehicle_label&value=run_id"
    )
  })

  test("selecting a vehicle adherence colors setting sets that value", async () => {
    const testDispatch = jest.fn()
    window.fetch = jest.fn<typeof window.fetch>()

    const result = render(
      <StateDispatchProvider state={initialState} dispatch={testDispatch}>
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await userEvent.click(
      result.getByTestId("vehicle-adherence-colors-early-blue")
    )

    expect(testDispatch).toHaveBeenCalledWith(
      setVehicleAdherenceColorsSetting(VehicleAdherenceColorsSetting.EarlyBlue)
    )
    // Updates the backend database
    expect(window.fetch).toHaveBeenCalledWith(
      "/api/user_settings?field=vehicle_adherence_colors&value=early_blue",
      expect.anything()
    )
  })
})
