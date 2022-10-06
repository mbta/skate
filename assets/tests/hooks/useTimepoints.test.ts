import { renderHook } from "@testing-library/react"
import * as Api from "../../src/api"
import useTimepoints from "../../src/hooks/useTimepoints"
import { Timepoint, TimepointsByRouteId } from "../../src/schedule.d"
import { instantPromise, mockUseStateOnce } from "../testHelpers/mockHelpers"

jest.mock("../../src/api", () => ({
  __esModule: true,

  fetchTimepointsForRoute: jest.fn(() => new Promise<Timepoint[]>(() => {})),
}))

describe("useTimepoints", () => {
  test("fetches timepoints for a route if we don't yet have them", () => {
    const mockFetchTimepoints: jest.Mock =
      Api.fetchTimepointsForRoute as jest.Mock

    const { result } = renderHook(() => {
      return useTimepoints(["1"])
    })

    expect(mockFetchTimepoints).toHaveBeenCalledTimes(1)
    expect(mockFetchTimepoints).toHaveBeenCalledWith("1")
    expect(result.current).toEqual({ "1": null })
  })

  test("returns timepoints when the api call returns", () => {
    const timepoints: Timepoint[] = [
      { id: "t1", name: "t1 name" },
      { id: "t2", name: "t2 name" },
    ]
    const mockFetchTimepoints: jest.Mock =
      Api.fetchTimepointsForRoute as jest.Mock
    mockFetchTimepoints.mockImplementationOnce(() => instantPromise(timepoints))

    const { result } = renderHook(() => {
      return useTimepoints(["1"])
    })

    expect(result.current).toEqual({ "1": timepoints })
  })

  test("does not refetch timepoints that are loading or loaded", () => {
    const selectedRouteIds = ["2", "3"]
    const timepointsByRouteId: TimepointsByRouteId = {
      2: null,
      3: [{ id: "t3", name: "t3 name" }],
    }

    const mockFetchTimepoints: jest.Mock =
      Api.fetchTimepointsForRoute as jest.Mock
    mockUseStateOnce<TimepointsByRouteId>(timepointsByRouteId)

    const { result } = renderHook(() => {
      return useTimepoints(selectedRouteIds)
    })

    expect(mockFetchTimepoints).not.toHaveBeenCalled()
    expect(result.current).toEqual(timepointsByRouteId)
  })
})
