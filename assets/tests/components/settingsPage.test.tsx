import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import SettingsPage from "../../src/components/settingsPage"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import featureIsEnabled from "../../src/laboratoryFeatures"
import {
  initialState,
  setLadderVehicleLabelSetting,
  setMinischedulesTripLabelSetting,
  setShuttleVehicleLabelSetting,
  setVehicleAdherenceColorsSetting,
} from "../../src/state"
import {
  defaultUserSettings,
  TripLabelSetting,
  VehicleLabelSetting,
  VehicleAdherenceColorsSetting,
} from "../../src/userSettings"

jest.mock("../../src/laboratoryFeatures", () => ({
  __esModule: true,
  default: jest.fn(),
}))

const mockDispatch = jest.fn()

describe("SettingsPage", () => {
  test("renders", () => {
    const tree = renderer
      .create(
        <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
          <SettingsPage />
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
        <SettingsPage />
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
        <SettingsPage />
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
        <SettingsPage />
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
        <SettingsPage />
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

  test("renders with the minischedule-trip-label feature flag on", () => {
    ;(featureIsEnabled as jest.Mock).mockImplementation(
      (feature) => feature === "minischedules_trip_label"
    )
    const tree = renderer
      .create(
        <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
          <SettingsPage />
        </StateDispatchProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("selecting a vehicle adherence colors setting sets that value", () => {
    ;(featureIsEnabled as jest.Mock).mockImplementationOnce(
      (feature) => feature === "vehicle_adherence_colors_setting"
    )

    const testDispatch = jest.fn()
    window.fetch = jest.fn()

    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={testDispatch}>
        <SettingsPage />
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

  test("selecting a minischedules trip label setting sets that value", () => {
    const testDispatch = jest.fn()
    window.fetch = jest.fn()
    ;(featureIsEnabled as jest.Mock).mockImplementationOnce(() => true)

    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={testDispatch}>
        <SettingsPage />
      </StateDispatchProvider>
    )

    const testEvent = {
      currentTarget: {
        value: `${TripLabelSetting.Origin}`,
      },
    } as React.FormEvent<HTMLSelectElement>

    wrapper
      .find('[data-option-id="minischedules-trip-label-origin"] input')
      .prop("onChange")!(testEvent)

    expect(testDispatch).toHaveBeenCalledWith(
      setMinischedulesTripLabelSetting(TripLabelSetting.Origin)
    )
    // Updates the backend database
    expect((window.fetch as jest.Mock).mock.calls[0][0]).toEqual(
      "/api/user_settings?field=minischedules_trip_label&value=origin"
    )
  })
})
