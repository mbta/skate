import { act, renderHook, waitFor } from "@testing-library/react"
import { putUserSetting, putRouteTabs } from "../../src/api"
import appData from "../../src/appData"
import usePersistedStateReducer, {
  filter,
  get,
  insert,
  merge,
} from "../../src/hooks/usePersistedStateReducer"
import {
  initialState,
  selectShuttleRun,
  createRouteTab,
  startingRouteTabsPush,
} from "../../src/state"
import {
  VehicleLabelSetting,
  VehicleAdherenceColorsSetting,
} from "../../src/userSettings"
import routeTabFactory from "../factories/routeTab"

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
}

jest.mock("../../src/api", () => ({
  __esModule: true,
  putRouteTabs: jest.fn(),
  putUserSetting: jest.fn(),
}))

jest.mock("../../src/appData", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    userSettings: JSON.stringify({
      ladder_page_vehicle_label: "run_id",
      shuttle_page_vehicle_label: "vehicle_id",
      vehicle_adherence_colors: "early_red",
    }),
  })),
}))

describe("usePersistedStateReducer", () => {
  const originalLocalStorage = window.localStorage

  beforeEach(() => {
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

  test("stores persisted keys in localstorage when they change", () => {
    const { result } = renderHook(() => usePersistedStateReducer())
    const dispatch = result.current[1]

    act(() => {
      dispatch(selectShuttleRun("123"))
    })

    const state = result.current[0]

    expect(state.selectedShuttleRunIds).toEqual(["123"])

    // last call is persisting the edit we're testing
    const calls = (window.localStorage.setItem as jest.Mock).mock.calls
    const lastCallIndex = calls.length - 1
    const persistedState = JSON.parse(calls[lastCallIndex][1])
    expect(persistedState.selectedShuttleRunIds).toEqual(["123"])
  })

  test("loads settings from the backend", () => {
    const mockSettings = {
      userSettings: JSON.stringify({
        ladder_page_vehicle_label: "run_id",
        shuttle_page_vehicle_label: "run_id",
        vehicle_adherence_colors: "early_blue",
      }),
      routeTabs: JSON.stringify([
        {
          uuid: "1",
          ordering: 0,
          preset_name: "some name",
          is_current_tab: true,
          selected_route_ids: ["1"],
          ladder_directions: {},
          ladder_crowding_toggles: {},
        },
      ]),
    }
    ;(appData as jest.Mock).mockImplementationOnce(() => mockSettings)
    ;(appData as jest.Mock).mockImplementationOnce(() => mockSettings)
    ;(appData as jest.Mock).mockImplementationOnce(() => mockSettings)
    const { result } = renderHook(() => usePersistedStateReducer())
    const [state] = result.current
    expect(state.userSettings.shuttleVehicleLabel).toEqual(
      VehicleLabelSetting.RunNumber
    )
    expect(state.userSettings.vehicleAdherenceColors).toEqual(
      VehicleAdherenceColorsSetting.EarlyBlue
    )
    expect(state.routeTabs).toEqual([
      routeTabFactory.build({
        uuid: "1",
        ordering: 0,
        presetName: "some name",
        isCurrentTab: true,
        selectedRouteIds: ["1"],
        ladderDirections: {},
        ladderCrowdingToggles: {},
      }),
    ])
  })

  test("if settings are in localstorage, copies them to the backend and uses them", () => {
    jest
      .spyOn(window.localStorage, "getItem")
      .mockImplementation(
        (_stateKey: string) =>
          '{"settings":{"ladderVehicleLabel":1,"shuttleVehicleLabel":1,"vehicleAdherenceColors":2}}'
      )

    const { result } = renderHook(() => usePersistedStateReducer())
    const [state] = result.current

    expect(state.userSettings).toEqual({
      ladderVehicleLabel: VehicleLabelSetting.RunNumber,
      shuttleVehicleLabel: VehicleLabelSetting.RunNumber,
      vehicleAdherenceColors: VehicleAdherenceColorsSetting.EarlyBlue,
    })
    // settings were saved to the database
    expect(putUserSetting).toHaveBeenCalled()
    // settings were removed from local storage
    const setItemParam = (window.localStorage.setItem as jest.Mock).mock
      .calls[0][1]
    expect(setItemParam).not.toContain("settings")
    expect(setItemParam).not.toContain("selectedRouteIds")
    expect(setItemParam).not.toContain("ladderDirections")
    expect(setItemParam).not.toContain("ladderCrowdingToggles")
  })

  test("if settings are in localstorage with vehicleAdherenceColors set to early_red, copies them to the backend and uses them", () => {
    jest
      .spyOn(window.localStorage, "getItem")
      .mockImplementation(
        (_stateKey: string) =>
          '{"settings":{"ladderVehicleLabel":1,"shuttleVehicleLabel":1,"vehicleAdherenceColors":1}}'
      )

    const { result } = renderHook(() => usePersistedStateReducer())
    const [state] = result.current

    expect(state.userSettings).toEqual({
      ladderVehicleLabel: VehicleLabelSetting.RunNumber,
      shuttleVehicleLabel: VehicleLabelSetting.RunNumber,
      vehicleAdherenceColors: VehicleAdherenceColorsSetting.EarlyRed,
    })
    // settings were saved to the database
    expect(putUserSetting).toHaveBeenCalled()
    // settings were removed from local storage
    const setItemParam = (window.localStorage.setItem as jest.Mock).mock
      .calls[0][1]
    expect(setItemParam).not.toContain("settings")
  })

  test("sends updated route tabs to backend on changes", () => {
    ;(putRouteTabs as jest.Mock).mockImplementationOnce(() => ({
      then: (callback: (data: any) => void) => {
        callback({ ok: true })
        return { catch: jest.fn() }
      },
    }))
    const { result } = renderHook(() => usePersistedStateReducer())
    const [, dispatch] = result.current

    act(() => {
      dispatch(createRouteTab())
    })
    const [state] = result.current
    const routeTab = state.routeTabs[0]
    expect(putRouteTabs).toHaveBeenCalledWith([routeTab])
    const [
      {
        routeTabs,
        routeTabsToPush,
        routeTabsToPushNext,
        routeTabsPushInProgress,
      },
    ] = result.current
    expect(routeTabs).toEqual([routeTab])
    expect(routeTabsToPush).toBeNull()
    expect(routeTabsToPushNext).toBeNull()
    expect(routeTabsPushInProgress).toEqual(false)
  })

  test("saves updated route tabs to push later if a push is currently in progress", () => {
    const { result } = renderHook(() => usePersistedStateReducer())
    const [, dispatch] = result.current

    act(() => {
      dispatch(startingRouteTabsPush())
      dispatch(createRouteTab())
    })

    const [state] = result.current

    expect(state.routeTabs).toMatchObject([
      {
        ordering: 0,
        isCurrentTab: true,
      },
    ])
    expect(state.routeTabsToPush).toEqual(state.routeTabs)
    expect(state.routeTabsToPushNext).toBeNull()
    expect(state.routeTabsPushInProgress).toEqual(true)
  })

  test("retries on HTTP error if not outdated", () => {
    const badResponse = { ok: false }
    const fakePromise = {
      then: (callback: (data: any) => void) => {
        callback(badResponse)
        return { catch: jest.fn() }
      },
    }

    const { result } = renderHook(() => usePersistedStateReducer())
    const [, dispatch] = result.current

    ;(putRouteTabs as jest.Mock).mockImplementationOnce(() => fakePromise)

    act(() => {
      dispatch(createRouteTab())
    })

    const [state] = result.current

    expect(state.routeTabs).toMatchObject([
      {
        ordering: 0,
        isCurrentTab: true,
      },
    ])
    expect(state.routeTabsToPush).toEqual(state.routeTabs)
    expect(state.routeTabsToPushNext).toBeNull()
    expect(state.routeTabsPushInProgress).toEqual(false)
  })

  test("retries on client error if not outdated", () => {
    const fakePromise = {
      then: () => ({
        catch: (callback: () => void) => {
          callback()
        },
      }),
    }

    const { result } = renderHook(() => usePersistedStateReducer())
    const [, dispatch] = result.current

    ;(putRouteTabs as jest.Mock).mockImplementationOnce(() => fakePromise)

    act(() => {
      dispatch(createRouteTab())
    })

    const [state] = result.current

    expect(state.routeTabs).toMatchObject([
      {
        ordering: 0,
        isCurrentTab: true,
      },
    ])
    expect(state.routeTabsToPush).toEqual(state.routeTabs)
    expect(state.routeTabsToPushNext).toBeNull()
    expect(state.routeTabsPushInProgress).toEqual(false)
  })

  test("retries at most two more times, with final failure being a bad status code", async () => {
    const badResponse = { ok: false }

    const fakePromise = new Promise((resolve) => {
      resolve(badResponse)
    })

    const { result } = renderHook(() => usePersistedStateReducer())
    const [, dispatch] = result.current

    ;(putRouteTabs as jest.Mock)
      .mockImplementationOnce(() => fakePromise)
      .mockImplementationOnce(() => fakePromise)
      .mockImplementationOnce(() => fakePromise)

    const firstValue = result.current

    act(() => {
      dispatch(createRouteTab())
    })
    await waitFor(() => {
      expect(result.current).not.toBe(firstValue)
    })

    // wait for changes from dispatch call in catch handler
    const secondValue = result.current

    await waitFor(() => {
      expect(result.current).not.toBe(secondValue)
    })

    const [state] = result.current

    expect(state.routeTabs).toMatchObject([
      {
        ordering: 0,
        isCurrentTab: true,
      },
    ])
    expect(state.routeTabsToPush).toBeNull()
    expect(state.routeTabsToPushNext).toBeNull()
    expect(state.routeTabsPushInProgress).toEqual(false)
    expect(putRouteTabs).toHaveBeenCalledTimes(3)
  })

  test("retries at most two more times, with final failure being a client error", async () => {
    const fakePromise = new Promise((_resolve, reject) => {
      reject()
    })

    const { result } = renderHook(() => usePersistedStateReducer())
    const [, dispatch] = result.current

    ;(putRouteTabs as jest.Mock)
      .mockImplementationOnce(() => fakePromise)
      .mockImplementationOnce(() => fakePromise)
      .mockImplementationOnce(() => fakePromise)

    act(() => {
      dispatch(createRouteTab())
    })
    const initialValue = result.current
    await waitFor(() => {
      expect(result.current).not.toBe(initialValue)
    })

    const [state] = result.current

    expect(state.routeTabs).toMatchObject([
      {
        ordering: 0,
        isCurrentTab: true,
      },
    ])
    expect(state.routeTabsToPush).toBeNull()
    expect(state.routeTabsToPushNext).toBeNull()
    expect(state.routeTabsPushInProgress).toEqual(false)
    expect(putRouteTabs).toHaveBeenCalledTimes(3)
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
