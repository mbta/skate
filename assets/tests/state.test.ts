import { VehicleId } from "../src/realtime.d"
import { VehicleLabelSetting } from "../src/settings"
import * as State from "../src/state"

const initialState = State.initialState
const reducer = State.reducer

describe("reducer", () => {
  test("selectRoute", () => {
    const state = {
      ...initialState,
      selectedRouteIds: ["28"],
    }
    const expectedState = {
      ...state,
      selectedRouteIds: ["28", "39"],
    }
    const newState = reducer(state, State.selectRoute("39"))
    expect(newState).toEqual(expectedState)
  })

  test("deselectRoute", () => {
    const state = {
      ...initialState,
      selectedRouteIds: ["28", "39"],
    }
    const expectedState = {
      ...state,
      selectedRouteIds: ["28"],
    }
    const newState = reducer(state, State.deselectRoute("39"))
    expect(newState).toEqual(expectedState)
  })

  test("selectVehicle", () => {
    const vehicleId: VehicleId = "v1"
    const state = initialState
    const expectedState = {
      ...state,
      selectedVehicleId: vehicleId,
    }

    const newState = reducer(state, State.selectVehicle(vehicleId))

    expect(newState).toEqual(expectedState)
  })

  test("deselectVehicle", () => {
    const initialVehicleId: VehicleId = "v1"
    const state = {
      ...initialState,
      selectVehicle: initialVehicleId,
    }
    const expectedState = {
      ...state,
      selectedVehicleId: undefined,
    }

    const newState = reducer(state, State.deselectVehicle())

    expect(newState).toEqual(expectedState)
  })

  test("togglePickerContainer", () => {
    const expectedState: State.State = {
      ...initialState,
      pickerContainerIsVisible: false,
    }

    const newState = reducer(initialState, State.togglePickerContainer())

    expect(newState).toEqual(expectedState)
  })

  test("setVehicleLabelSetting", () => {
    const vehicleLabel: VehicleLabelSetting = VehicleLabelSetting.VehicleNumber
    const state = initialState
    const expectedState = {
      ...state,
      settings: {
        ...state.settings,
        vehicleLabel,
      },
    }

    const newState = reducer(state, State.setVehicleLabelSetting(vehicleLabel))

    expect(newState).toEqual(expectedState)
  })
})
