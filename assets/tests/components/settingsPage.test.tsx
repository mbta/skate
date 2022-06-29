import { mount } from "enzyme"
import React from "react"
import { BrowserRouter } from "react-router-dom"
import { render } from "@testing-library/react"
import renderer from "react-test-renderer"
import SettingsPage from "../../src/components/settingsPage"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import featureIsEnabled from "../../src/laboratoryFeatures"
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
import vehicleFactory from "../factories/vehicle"

jest.mock("../../src/laboratoryFeatures", () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock("../../src/hooks/useNearestIntersection", () => ({
  __esModule: true,
  useNearestIntersection: jest.fn(() => null),
}))

jest.mock("../../src/hooks/useShapes", () => ({
  __esModule: true,
  useTripShape: jest.fn(() => null),
}))

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

    const wrapper = mount(
      <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )
    const vehicleNumberOptionChecked = wrapper
      .find('[data-option-id="ladder-vehicle-label-vehicle-number"] input')
      .prop("checked")

    expect(vehicleNumberOptionChecked).toBeTruthy()
  })

  test("selecting a ladder vehicle label setting sets that value", () => {
    const testDispatch = jest.fn()
    window.fetch = jest.fn()

    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={testDispatch}>
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )
    const testEvent = {
      currentTarget: {
        value: `${VehicleLabelSetting.RunNumber}`,
      },
    } as React.FormEvent<HTMLSelectElement>
    wrapper
      .find('[data-option-id="ladder-vehicle-label-run-number"] input')
      .prop("onChange")!(testEvent)

    expect(testDispatch).toHaveBeenCalledWith(
      setLadderVehicleLabelSetting(VehicleLabelSetting.RunNumber)
    )
    // Updates the backend database
    expect((window.fetch as jest.Mock).mock.calls[0][0]).toEqual(
      "/api/user_settings?field=ladder_page_vehicle_label&value=run_id"
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

    const wrapper = mount(
      <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )
    const runNumberOptionChecked = wrapper
      .find('[data-option-id="shuttle-vehicle-label-run-number"] input')
      .prop("checked")

    expect(runNumberOptionChecked).toBeTruthy()
  })

  test("selecting a map vehicle label setting sets that value", () => {
    const testDispatch = jest.fn()
    window.fetch = jest.fn()

    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={testDispatch}>
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )
    const testEvent = {
      currentTarget: {
        value: `${VehicleLabelSetting.VehicleNumber}`,
      },
    } as React.FormEvent<HTMLSelectElement>
    wrapper
      .find('[data-option-id="shuttle-vehicle-label-vehicle-number"] input')
      .prop("onChange")!(testEvent)

    expect(testDispatch).toHaveBeenCalledWith(
      setShuttleVehicleLabelSetting(VehicleLabelSetting.VehicleNumber)
    )
    // Updates the backend database
    expect((window.fetch as jest.Mock).mock.calls[0][0]).toEqual(
      "/api/user_settings?field=shuttle_page_vehicle_label&value=vehicle_id"
    )
  })

  test("selecting a vehicle adherence colors setting sets that value", () => {
    ;(featureIsEnabled as jest.Mock).mockImplementationOnce(
      (feature) => feature === "vehicle_adherence_colors_setting"
    )

    const testDispatch = jest.fn()
    window.fetch = jest.fn()

    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={testDispatch}>
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )
    const testEvent = {
      currentTarget: {
        value: `${VehicleAdherenceColorsSetting.EarlyBlue}`,
      },
    } as React.ChangeEvent<HTMLSelectElement>
    wrapper
      .find('[data-option-id="vehicle-adherence-colors-early-blue"] input')
      .prop("onChange")!(testEvent)

    expect(testDispatch).toHaveBeenCalledWith(
      setVehicleAdherenceColorsSetting(VehicleAdherenceColorsSetting.EarlyBlue)
    )
    // Updates the backend database
    expect((window.fetch as jest.Mock).mock.calls[0][0]).toEqual(
      "/api/user_settings?field=vehicle_adherence_colors&value=early_blue"
    )
  })

  test("renders vehicle properties panel if a vehicle is selected", () => {
    const vehicle = vehicleFactory.build({ operatorLastName: "Smith" })

    const result = render(
      <StateDispatchProvider
        state={{ ...initialState, selectedVehicleOrGhost: vehicle }}
        dispatch={mockDispatch}
      >
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(result.getByText(/Smith/)).not.toBeNull()
  })
})
