import { renderHook } from "@testing-library/react-hooks"
import * as Api from "../../src/api"
import useTrips, {
  SECONDS_AHEAD_TO_FETCH,
  SECONDS_AHEAD_TO_REFETCH,
  SECONDS_BEHIND_TO_FETCH,
} from "../../src/hooks/useTrips"
import { instantPromise, mockUseReducerOnce } from "../testHelpers/mockHelpers"

// tslint:disable: react-hooks-nesting no-empty

jest.mock("../../src/api", () => ({
  __esModule: true,
  fetchTrips: jest.fn(() => new Promise(() => {})),
}))

describe("useTrips", () => {
  test("fetches schedules for selected route", () => {
    const now = 1000000
    jest.spyOn(global.Date, "now").mockImplementation(() => now * 1000)
    const mockFetchTrips: jest.Mock = Api.fetchTrips as jest.Mock

    renderHook(() => {
      useTrips(["1"])
    })

    expect(mockFetchTrips).toHaveBeenCalledWith(
      "1",
      now - SECONDS_BEHIND_TO_FETCH,
      now + SECONDS_AHEAD_TO_FETCH
    )
  })

  test("doesn't refetch if it's already loading", () => {
    const now = 1000000
    jest.spyOn(global.Date, "now").mockImplementation(() => now * 1000)
    const mockFetchTrips: jest.Mock = Api.fetchTrips as jest.Mock
    mockUseReducerOnce({
      lastRequestedTime: { ["1"]: now + SECONDS_AHEAD_TO_FETCH - 1 },
      lastLoadedTime: {},
      tripsById: {},
    })

    renderHook(() => {
      useTrips(["1"])
    })

    expect(mockFetchTrips).not.toHaveBeenCalled()
  })

  test("doesn't refetch if the current data is up to date", () => {
    const now = 1000000
    jest.spyOn(global.Date, "now").mockImplementation(() => now * 1000)
    const mockFetchTrips: jest.Mock = Api.fetchTrips as jest.Mock
    mockUseReducerOnce({
      lastRequestedTime: {},
      lastLoadedTime: { ["1"]: now + SECONDS_AHEAD_TO_REFETCH + 1 },
      tripsById: {},
    })

    renderHook(() => {
      useTrips(["1"])
    })

    expect(mockFetchTrips).not.toHaveBeenCalled()
  })

  test("refetches newer schedules once they're old", () => {
    const now = 1000000
    jest.spyOn(global.Date, "now").mockImplementation(() => now * 1000)
    const mockFetchTrips: jest.Mock = Api.fetchTrips as jest.Mock
    mockUseReducerOnce({
      lastRequestedTime: {},
      lastLoadedTime: { ["1"]: now + SECONDS_AHEAD_TO_REFETCH - 1 },
      tripsById: {},
    })

    renderHook(() => {
      useTrips(["1"])
    })

    expect(mockFetchTrips).toHaveBeenCalledTimes(1)
    expect(mockFetchTrips).toHaveBeenCalledWith(
      "1",
      now + SECONDS_AHEAD_TO_REFETCH - 1,
      now + SECONDS_AHEAD_TO_FETCH
    )
  })

  test("fetches schedules for newly selected routes", () => {
    const now = 1000000
    jest.spyOn(global.Date, "now").mockImplementation(() => now * 1000)
    const mockFetchTrips: jest.Mock = Api.fetchTrips as jest.Mock
    mockUseReducerOnce({
      lastRequestedTime: {},
      lastLoadedTime: { ["1"]: now + SECONDS_AHEAD_TO_REFETCH + 1 },
      tripsById: {},
    })

    renderHook(() => {
      useTrips(["1", "2"])
    })

    expect(mockFetchTrips).toHaveBeenCalledTimes(1)
    expect(mockFetchTrips).toHaveBeenCalledWith(
      "2",
      now - SECONDS_BEHIND_TO_FETCH,
      now + SECONDS_AHEAD_TO_FETCH
    )
  })

  test("returns empty data while loading", () => {
    const { result } = renderHook(() => {
      return useTrips(["1"])
    })

    expect(result.current).toEqual({})
  })

  test("returns data once it's loaded", () => {
    const trip = {
      id: "trip",
      routeId: "1",
      headsign: "headsign",
      directionId: 0,
      blockId: "block",
      routePatternId: null,
      stopTimes: [],
    }
    const mockFetchTrips: jest.Mock = Api.fetchTrips as jest.Mock
    mockFetchTrips.mockImplementationOnce(() => instantPromise([trip]))

    const { result } = renderHook(() => {
      return useTrips(["1"])
    })

    expect(mockFetchTrips).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual({ [trip.id]: trip })
  })
})
