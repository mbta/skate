import { renderHook } from "@testing-library/react-hooks"
import * as Api from "../../src/api"
import {
  useMinischeduleBlock,
  useMinischeduleRun,
  useMinischeduleRuns,
} from "../../src/hooks/useMinischedule"
import { Block, Run } from "../../src/minischedule"
import { instantPromise, neverPromise } from "../testHelpers/mockHelpers"

// tslint:disable: react-hooks-nesting

jest.mock("../../src/api", () => ({
  __esModule: true,
  fetchMinischeduleRun: jest.fn(() => neverPromise()),
  fetchMinischeduleBlock: jest.fn(() => neverPromise()),
}))

describe("useMinischeduleRun", () => {
  test("returns undefined while loading", () => {
    const mockFetchMinischeduleRun: jest.Mock = Api.fetchMinischeduleRun as jest.Mock
    const { result } = renderHook(() => {
      return useMinischeduleRun("trip")
    })
    expect(mockFetchMinischeduleRun).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual(undefined)
  })

  test("returns a run", () => {
    const run: Run = ("run" as any) as Run
    const mockFetchMinischeduleRun: jest.Mock = Api.fetchMinischeduleRun as jest.Mock
    mockFetchMinischeduleRun.mockImplementationOnce(() => instantPromise(run))
    const { result } = renderHook(() => {
      return useMinischeduleRun("trip")
    })
    expect(result.current).toEqual(run)
  })

  test("doesn't refetch on every render", () => {
    const mockFetchShuttles: jest.Mock = Api.fetchMinischeduleRun as jest.Mock
    const { rerender } = renderHook(() => {
      return useMinischeduleRun("trip")
    })
    rerender()
    expect(mockFetchShuttles).toHaveBeenCalledTimes(1)
  })
})

describe("useMinischeduleRuns", () => {
  test("returns undefined while loading", () => {
    const mockFetchMinischeduleRun: jest.Mock = Api.fetchMinischeduleRun as jest.Mock
    const { result } = renderHook(() => {
      return useMinischeduleRuns(["trip"])
    })
    expect(mockFetchMinischeduleRun).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual(undefined)
  })

  test("returns runs", async () => {
    const run1: Run = ("run1" as any) as Run
    const run2: Run = ("run2" as any) as Run
    const mockFetchMinischeduleRun: jest.Mock = Api.fetchMinischeduleRun as jest.Mock
    mockFetchMinischeduleRun
      .mockImplementationOnce(() => instantPromise(run1))
      .mockImplementationOnce(() => instantPromise(run2))
    const { result, waitForNextUpdate } = renderHook(() => {
      return useMinischeduleRuns(["trip1", "trip2"])
    })
    await waitForNextUpdate()

    expect(result.current).toEqual([run1, run2])
  })

  test("doesn't refetch on every render", () => {
    const mockFetchMinischeduleRun: jest.Mock = Api.fetchMinischeduleRun as jest.Mock
    const { rerender } = renderHook(() => {
      return useMinischeduleRuns(["trip"])
    })
    rerender()
    expect(mockFetchMinischeduleRun).toHaveBeenCalledTimes(1)
  })
})

describe("useMinischeduleBlock", () => {
  test("returns undefined while loading", () => {
    const mockFetchMinischeduleBlock: jest.Mock = Api.fetchMinischeduleBlock as jest.Mock
    const { result } = renderHook(() => {
      return useMinischeduleBlock("trip")
    })
    expect(mockFetchMinischeduleBlock).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual(undefined)
  })

  test("returns a block", () => {
    const block: Block = ("block" as any) as Block
    const mockFetchMinischeduleBlock: jest.Mock = Api.fetchMinischeduleBlock as jest.Mock
    mockFetchMinischeduleBlock.mockImplementationOnce(() =>
      instantPromise(block)
    )
    const { result } = renderHook(() => {
      return useMinischeduleBlock("trip")
    })
    expect(result.current).toEqual(block)
  })

  test("doesn't refetch on every render", () => {
    const mockFetchShuttles: jest.Mock = Api.fetchMinischeduleBlock as jest.Mock
    const { rerender } = renderHook(() => {
      return useMinischeduleBlock("trip")
    })
    rerender()
    expect(mockFetchShuttles).toHaveBeenCalledTimes(1)
  })
})
