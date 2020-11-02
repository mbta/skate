import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import SettingsPage from "../../src/components/settingsPage"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import {
  initialState,
  setLadderVehicleLabelSetting,
  setShuttleVehicleLabelSetting,
} from "../../src/state"
import {
  defaultUserSettings,
  VehicleLabelSetting,
} from "../../src/userSettings"

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
    const ladderVehicleLabelSelectValue = wrapper
      .find("#ladder-vehicle-label-setting")
      .prop("value")

    expect(ladderVehicleLabelSelectValue).toEqual(
      VehicleLabelSetting.VehicleNumber
    )
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
    wrapper.find("#ladder-vehicle-label-setting").simulate("change", testEvent)

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
    const shuttleVehicleLabelSelectValue = wrapper
      .find("#map-vehicle-label-setting")
      .prop("value")

    expect(shuttleVehicleLabelSelectValue).toEqual(
      VehicleLabelSetting.RunNumber
    )
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
    wrapper.find("#map-vehicle-label-setting").simulate("change", testEvent)

    expect(testDispatch).toHaveBeenCalledWith(
      setShuttleVehicleLabelSetting(VehicleLabelSetting.VehicleNumber)
    )
    // Updates the backend database
    expect((window.fetch as jest.Mock).mock.calls[0][0]).toEqual(
      "/api/user_settings?field=shuttle_page_vehicle_label&value=vehicle_id"
    )
  })
})
