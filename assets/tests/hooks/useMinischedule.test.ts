import { jest, describe, test, expect } from "@jest/globals"
import { renderHook, waitFor } from "@testing-library/react"
import * as Api from "../../src/api"
import {
  useMinischeduleBlock,
  useMinischeduleRun,
  useMinischeduleRuns,
} from "../../src/hooks/useMinischedule"
import { Block, Run } from "../../src/minischedule"
import { instantPromise, neverPromise } from "../testHelpers/mockHelpers"
import { TripId } from "../../src/schedule"

jest.mock("../../src/api", () => ({
  __esModule: true,
  fetchScheduleRun: jest.fn(() => neverPromise()),
  fetchScheduleBlock: jest.fn(() => neverPromise()),
}))

describe("useMinischeduleRun", () => {
  test("returns undefined while loading", () => {
    const mockFetchScheduleRun: jest.Mock = Api.fetchScheduleRun as jest.Mock
    const { result } = renderHook(() => {
      return useMinischeduleRun("trip", "run")
    })
    expect(mockFetchScheduleRun).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual(undefined)
  })

  test("returns a run", () => {
    const run: Run = "run" as any as Run
    const mockFetchScheduleRun: jest.Mock = Api.fetchScheduleRun as jest.Mock
    mockFetchScheduleRun.mockImplementationOnce(() => instantPromise(run))
    const { result } = renderHook(() => {
      return useMinischeduleRun("trip", "run")
    })
    expect(result.current).toEqual(run)
  })

  test("doesn't refetch on every render", () => {
    const mockFetchShuttles: jest.Mock = Api.fetchScheduleRun as jest.Mock
    const { rerender } = renderHook(() => {
      return useMinischeduleRun("trip", "run")
    })
    rerender()
    expect(mockFetchShuttles).toHaveBeenCalledTimes(1)
  })

  test("refetches when trip changes", () => {
    const mockFetchShuttles: jest.Mock = Api.fetchScheduleRun as jest.Mock
    const { rerender } = renderHook(
      ({ trip, run }) => useMinischeduleRun(trip, run),
      {
        initialProps: { trip: "trip1", run: "run1" },
      }
    )
    rerender({ trip: "trip2", run: "run1" })
    expect(mockFetchShuttles).toHaveBeenCalledTimes(2)
  })

  test("refetches when run changes", () => {
    const mockFetchShuttles: jest.Mock = Api.fetchScheduleRun as jest.Mock
    const { rerender } = renderHook(
      ({ trip, run }) => useMinischeduleRun(trip, run),
      {
        initialProps: { trip: "trip1", run: "run1" },
      }
    )
    rerender({ trip: "trip1", run: "run2" })
    expect(mockFetchShuttles).toHaveBeenCalledTimes(2)
  })
})

describe("useMinischeduleRuns", () => {
  test("returns undefined while loading", () => {
    const mockFetchScheduleRun: jest.Mock = Api.fetchScheduleRun as jest.Mock
    const { result } = renderHook(() => {
      return useMinischeduleRuns(["trip"])
    })
    expect(mockFetchScheduleRun).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual(undefined)
  })

  test("returns runs", async () => {
    const run1: Run = "run1" as any as Run
    const run2: Run = "run2" as any as Run
    const mockFetchScheduleRun: jest.Mock = Api.fetchScheduleRun as jest.Mock
    mockFetchScheduleRun
      .mockImplementationOnce(() => instantPromise(run1))
      .mockImplementationOnce(() => instantPromise(run2))
    const { result } = renderHook(() => {
      return useMinischeduleRuns(["trip1", "trip2"])
    })
    const initialValue = result.current
    await waitFor(() => {
      expect(result.current).not.toBe(initialValue)
    })

    expect(result.current).toEqual([run1, run2])
  })

  test("doesn't refetch on every render", () => {
    const mockFetchScheduleRun: jest.Mock = Api.fetchScheduleRun as jest.Mock
    const { rerender } = renderHook(() => {
      return useMinischeduleRuns(["trip"])
    })
    rerender()
    expect(mockFetchScheduleRun).toHaveBeenCalledTimes(1)
  })

  test("doesn't refetch with same trip IDs", () => {
    const mockFetchScheduleRun: jest.Mock = Api.fetchScheduleRun as jest.Mock
    const { rerender } = renderHook(() => {
      return useMinischeduleRuns(["trip"])
    })
    rerender(["trip"])
    expect(mockFetchScheduleRun).toHaveBeenCalledTimes(1)
  })

  test("does refetch when trip IDs changed", () => {
    const mockFetchScheduleRun: jest.Mock = Api.fetchScheduleRun as jest.Mock
    const { rerender } = renderHook(
      (tripIds: TripId[]) => {
        return useMinischeduleRuns(tripIds)
      },
      { initialProps: ["trip1"] }
    )
    rerender(["trip2"])
    expect(mockFetchScheduleRun).toHaveBeenCalledTimes(2)
  })
})

describe("useMinischeduleBlock", () => {
  test("returns undefined while loading", () => {
    const mockFetchScheduleBlock: jest.Mock =
      Api.fetchScheduleBlock as jest.Mock
    const { result } = renderHook(() => {
      return useMinischeduleBlock("trip")
    })
    expect(mockFetchScheduleBlock).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual(undefined)
  })

  test("returns a block", () => {
    const block: Block = "block" as any as Block
    const mockFetchScheduleBlock: jest.Mock =
      Api.fetchScheduleBlock as jest.Mock
    mockFetchScheduleBlock.mockImplementationOnce(() => instantPromise(block))
    const { result } = renderHook(() => {
      return useMinischeduleBlock("trip")
    })
    expect(result.current).toEqual(block)
  })

  test("doesn't refetch on every render", () => {
    const mockFetchShuttles: jest.Mock = Api.fetchScheduleBlock as jest.Mock
    const { rerender } = renderHook(() => {
      return useMinischeduleBlock("trip")
    })
    rerender()
    expect(mockFetchShuttles).toHaveBeenCalledTimes(1)
  })
})
