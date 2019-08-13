import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import SettingsPage from "../../src/components/settingsPage"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { defaultSettings, VehicleLabelSetting } from "../../src/settings"
import { initialState, setVehicleLabelSetting } from "../../src/state"

const mockDispatch = jest.fn()

describe("SettingsPage", () => {
  test("renders", () => {
    // const mockState = { ...initialState, settings: { ...defaultSettings } }

    const tree = renderer
      .create(
        <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
          <SettingsPage />
        </StateDispatchProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("displays the current vehicle label setting", () => {
    const mockState = {
      ...initialState,
      settings: {
        ...defaultSettings,
        vehicleLabel: VehicleLabelSetting.VehicleNumber,
      },
    }

    const wrapper = mount(
      <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
        <SettingsPage />
      </StateDispatchProvider>
    )
    const vehicleLabelSelectValue = wrapper
      .find("#vehicle-label-setting")
      .prop("value")

    expect(vehicleLabelSelectValue).toEqual(VehicleLabelSetting.VehicleNumber)
  })

  test("selecting a vehicle label setting sets that value", () => {
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
    wrapper.find("#vehicle-label-setting").simulate("change", testEvent)

    expect(testDispatch).toHaveBeenCalledWith(
      setVehicleLabelSetting(VehicleLabelSetting.RunNumber)
    )
  })
})
