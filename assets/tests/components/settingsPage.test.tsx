import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import SettingsPage from "../../src/components/settingsPage"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { defaultSettings, VehicleLabelSetting } from "../../src/settings"
import {
  initialState,
  setLadderVehicleLabelSetting,
  setMapVehicleLabelSetting,
} from "../../src/state"

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
      settings: {
        ...defaultSettings,
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
  })

  test("displays the current map vehicle label setting", () => {
    const mockState = {
      ...initialState,
      settings: {
        ...defaultSettings,
        mapVehicleLabel: VehicleLabelSetting.RunNumber,
      },
    }

    const wrapper = mount(
      <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
        <SettingsPage />
      </StateDispatchProvider>
    )
    const mapVehicleLabelSelectValue = wrapper
      .find("#map-vehicle-label-setting")
      .prop("value")

    expect(mapVehicleLabelSelectValue).toEqual(VehicleLabelSetting.RunNumber)
  })

  test("selecting a map vehicle label setting sets that value", () => {
    const testDispatch = jest.fn()

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
      setMapVehicleLabelSetting(VehicleLabelSetting.VehicleNumber)
    )
  })
})
