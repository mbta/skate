import { act, renderHook } from "@testing-library/react-hooks"
import usePersistedStateReducer, {
  filter,
  get,
  insert,
  merge,
} from "../../src/hooks/usePersistedStateReducer"
import { VehicleLabelSetting } from "../../src/settings"
import { initialState, selectVehicle, State } from "../../src/state"

// tslint:disable: react-hooks-nesting

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
          '{"selectedRouteIds":["28","39"],"settings":{"ladderVehicleLabel":1,"shuttleVehicleLabel":1}}'
      )

    const expectedState: State = {
      ...initialState,
      selectedRouteIds: ["28", "39"],
      settings: {
        ladderVehicleLabel: VehicleLabelSetting.RunNumber,
        shuttleVehicleLabel: VehicleLabelSetting.RunNumber,
      },
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

    // first call is persisting the initial state
    // second call is persisting the edit we're testing
    expect(window.localStorage.setItem).toHaveBeenCalledTimes(2)
    const persistedState = JSON.parse(
      (window.localStorage.setItem as jest.Mock).mock.calls[1][1]
    )
    expect(persistedState.selectedVehicleId).toEqual("vehicle_id")
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
