import { renderHook } from "@testing-library/react-hooks"
import usePersistedStateReducer, {
  filter,
} from "../../src/hooks/usePersistedStateReducer"
import { VehicleLabelSetting } from "../../src/settings"
import { Reducer, State } from "../../src/state"

// tslint:disable: react-hooks-nesting

const reducer: Reducer = (state, _action) => state

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
}

describe("usePersistedStateReducer", () => {
  const originalLocalStorage = window.localStorage

  beforeAll(() => {
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
    })
    jest
      .spyOn(window.localStorage, "getItem")
      .mockImplementation((_stateKey: string) => null)
  })

  afterAll(() => {
    Object.defineProperty(window, "localStorage", originalLocalStorage)
  })

  test("initializes the state with the given initial value", () => {
    const initialState: State = {
      pickerContainerIsVisible: true,
      selectedRouteIds: ["1", "2"],
      selectedShuttleRunIds: [],
      selectedVehicleId: "2",
      settings: {
        vehicleLabel: undefined,
        ladderVehicleLabel: VehicleLabelSetting.RunNumber,
        mapVehicleLabel: VehicleLabelSetting.VehicleNumber,
      },
    }

    const { result } = renderHook(() =>
      usePersistedStateReducer(reducer, initialState)
    )
    const [state, dispatch] = result.current

    expect(state).toEqual(initialState)
    expect(typeof dispatch).toEqual("function")
  })

  test("loads initial state from local storage", () => {
    jest
      .spyOn(window.localStorage, "getItem")
      .mockImplementation(
        (_stateKey: string) =>
          '{"selectedRouteIds":["28","39"],"settings":{"ladderVehicleLabel":1,"mapVehicleLabel":1}}'
      )

    const initialState: State = {
      pickerContainerIsVisible: true,
      selectedRouteIds: ["1", "2"],
      selectedShuttleRunIds: [],
      selectedVehicleId: "2",
      settings: {
        vehicleLabel: undefined,
        ladderVehicleLabel: VehicleLabelSetting.RunNumber,
        mapVehicleLabel: VehicleLabelSetting.VehicleNumber,
      },
    }
    const expectedState: State = {
      pickerContainerIsVisible: true,
      selectedRouteIds: ["28", "39"],
      selectedShuttleRunIds: [],
      selectedVehicleId: "2",
      settings: {
        vehicleLabel: undefined,
        ladderVehicleLabel: VehicleLabelSetting.RunNumber,
        mapVehicleLabel: VehicleLabelSetting.RunNumber,
      },
    }

    const { result } = renderHook(() =>
      usePersistedStateReducer(reducer, initialState)
    )
    const [state] = result.current

    expect(state).toEqual(expectedState)
  })

  test("fixes deprecated vehicleLabel settings property", () => {
    jest
      .spyOn(window.localStorage, "getItem")
      .mockImplementation(
        (_stateKey: string) =>
          '{"selectedRouteIds":["28","39"],"settings":{"vehicleLabel":2}}'
      )

    const initialState: State = {
      pickerContainerIsVisible: true,
      selectedRouteIds: ["1", "2"],
      selectedShuttleRunIds: [],
      selectedVehicleId: "2",
      settings: {
        vehicleLabel: undefined,
        ladderVehicleLabel: VehicleLabelSetting.RunNumber,
        mapVehicleLabel: VehicleLabelSetting.VehicleNumber,
      },
    }
    const expectedState: State = {
      pickerContainerIsVisible: true,
      selectedRouteIds: ["28", "39"],
      selectedShuttleRunIds: [],
      selectedVehicleId: "2",
      settings: {
        vehicleLabel: undefined,
        ladderVehicleLabel: VehicleLabelSetting.VehicleNumber,
        mapVehicleLabel: VehicleLabelSetting.VehicleNumber,
      },
    }

    const { result } = renderHook(() =>
      usePersistedStateReducer(reducer, initialState)
    )
    const [state] = result.current

    expect(state).toEqual(expectedState)
  })
})

describe("filter", () => {
  test("filters an object by allowed keys", () => {
    const originalObject = {
      one: 1,
      three: 3,
      two: 2,
    }
    const allowedKeys = ["one", "three"]
    const expected = {
      one: 1,
      three: 3,
    }

    expect(filter(originalObject, allowedKeys)).toEqual(expected)
  })
})
