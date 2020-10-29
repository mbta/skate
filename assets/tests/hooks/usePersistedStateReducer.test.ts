import { act, renderHook } from "@testing-library/react-hooks"
import { putUserSetting } from "../../src/api"
import appData from "../../src/appData"
import usePersistedStateReducer, {
  filter,
  get,
  insert,
  merge,
} from "../../src/hooks/usePersistedStateReducer"
import { initialState, selectVehicle, State } from "../../src/state"
import { VehicleLabelSetting } from "../../src/userSettings"

// tslint:disable: react-hooks-nesting

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
}

jest.mock("../../src/api", () => ({
  __esModule: true,
  putRouteSettings: jest.fn(),
  putUserSetting: jest.fn(),
}))

jest.mock("../../src/appData", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    userSettings: JSON.stringify({
      ladder_page_vehicle_label: "run_id",
      shuttle_page_vehicle_label: "vehicle_id",
    }),
  })),
}))

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

  test("initializes the state", () => {
    const { result } = renderHook(() => usePersistedStateReducer())
    const [state, dispatch] = result.current

    expect(state).toEqual(initialState)
    expect(typeof dispatch).toEqual("function")
  })

  test("loads initial state from local storage", () => {
    jest
      .spyOn(window.localStorage, "getItem")
      .mockImplementation(
        (_stateKey: string) =>
          '{"selectedRouteIds":["28","39"],"ladderDirections":{"39":0},"ladderCrowdingToggles":{"77":true}}'
      )

    const expectedState: State = {
      ...initialState,
      selectedRouteIds: ["28", "39"],
      ladderDirections: { "39": 0 },
      ladderCrowdingToggles: { "77": true },
    }

    const { result } = renderHook(() => usePersistedStateReducer())
    const [state] = result.current

    expect(state).toEqual(expectedState)
  })

  test("stores persisted keys in localstorage when they change", () => {
    const { result } = renderHook(() => usePersistedStateReducer())
    const dispatch = result.current[1]

    act(() => {
      dispatch(selectVehicle("vehicle_id"))
    })

    const state = result.current[0]

    expect(state.selectedVehicleId).toEqual("vehicle_id")

    // last call is persisting the edit we're testing
    const calls = (window.localStorage.setItem as jest.Mock).mock.calls
    const lastCallIndex = calls.length - 1
    const persistedState = JSON.parse(calls[lastCallIndex][1])
    expect(persistedState.selectedVehicleId).toEqual("vehicle_id")
  })

  test("loads settings from the backend", () => {
    ;(appData as jest.Mock).mockImplementationOnce(() => ({
      userSettings: JSON.stringify({
        ladder_page_vehicle_label: "run_id",
        shuttle_page_vehicle_label: "run_id",
      }),
    }))
    const { result } = renderHook(() => usePersistedStateReducer())
    const [state] = result.current
    expect(state.userSettings.shuttleVehicleLabel).toEqual(
      VehicleLabelSetting.RunNumber
    )
  })

  test("if user settings are in localstorage, copies them to the backend and uses them", () => {
    jest
      .spyOn(window.localStorage, "getItem")
      .mockImplementation(
        (_stateKey: string) =>
          '{"settings":{"ladderVehicleLabel":1,"shuttleVehicleLabel":1}}'
      )

    const { result } = renderHook(() => usePersistedStateReducer())
    const [state] = result.current

    expect(state.userSettings).toEqual({
      ladderVehicleLabel: VehicleLabelSetting.RunNumber,
      shuttleVehicleLabel: VehicleLabelSetting.RunNumber,
    })
    // settings were saved to the database
    expect(putUserSetting).toHaveBeenCalled()
    // settings were removed from local storage
    expect(
      (window.localStorage.setItem as jest.Mock).mock.calls[0][1]
    ).not.toContain("settings")
  })
})

describe("get", () => {
  test("gets a nested key", () => {
    expect(get({ a: { b: { c: "d" }, b2: "b2" } }, ["a", "b"])).toEqual({
      c: "d",
    })
  })
})

describe("insert", () => {
  test("overwrites an existing value", () => {
    expect(
      insert({ a: { b: "c", b2: "b2" }, a2: "a2" }, ["a", "b"], "d")
    ).toEqual({ a: { b: "d", b2: "b2" }, a2: "a2" })
  })

  test("creates keys as needed", () => {
    expect(insert({}, ["a", "b"], "c")).toEqual({ a: { b: "c" } })
  })
})

describe("filter", () => {
  test("filters an object by allowed keys", () => {
    expect(
      filter({ a1: "a1", a2: "a2", a3: { b1: "b1", b2: "b2" } }, [
        ["a1"],
        ["a3", "b1"],
      ])
    ).toEqual({ a1: "a1", a3: { b1: "b1" } })
  })

  test("keys that don't exist don't show up in the result", () => {
    expect(filter({}, [["key"]])).toEqual({})
  })
})

describe("merge", () => {
  test("overwrites values in the base with values from the top", () => {
    const base = { a: "a" }
    const top = { a: "b" }
    const keys = [["a"]]
    expect(merge(base, top, keys)).toEqual(top)
  })
  test("ignores unspecified values in the top", () => {
    const base = { a: "a" }
    const top = { a: "b" }
    const keys: string[][] = []
    expect(merge(base, top, keys)).toEqual(base)
  })
  test("ignores missing values in the top", () => {
    const base = { a: "a" }
    const top = {}
    const keys = [["a"]]
    expect(merge(base, top, keys)).toEqual(base)
  })
})
