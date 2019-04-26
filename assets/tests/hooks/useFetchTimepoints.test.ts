import { act } from "react-test-renderer"
import * as Api from "../../src/api"
import { useFetchTimepoints } from "../../src/hooks/useFetchTimepoints"
import { setLoadingTimepointsForRoute } from "../../src/state"
import { testHook } from "../testHelpers/testHook"

// tslint:disable: react-hooks-nesting no-empty

jest.mock("../../src/api", () => ({
  __esModule: true,
  fetchTimepointsForRoute: jest.fn(() => new Promise(() => {})),
}))

describe("useFetchTimepoints", () => {
  test("fetches timepoints for a route if we don't yet have them", () => {
    const selectedRouteIds = ["1"]
    const timepointsByRouteId = {}
    const mockDispatch = jest.fn()

    const mockFetchTimepoints: jest.Mock = Api.fetchTimepointsForRoute as jest.Mock

    act(() => {
      testHook(() => {
        useFetchTimepoints(selectedRouteIds, timepointsByRouteId, mockDispatch)
      })
    })

    expect(mockFetchTimepoints).toHaveBeenCalledTimes(1)
    expect(mockFetchTimepoints).toHaveBeenCalledWith("1")
    expect(mockDispatch).toHaveBeenCalledWith(setLoadingTimepointsForRoute("1"))
  })

  test("does not refetch timepoints that are loading or loaded", () => {
    const selectedRouteIds = ["2", "3"]
    const timepointsByRouteId = {
      2: null,
      3: [{ id: "t3" }],
    }
    const mockDispatch = jest.fn()
    const mockFetchTimepoints: jest.Mock = Api.fetchTimepointsForRoute as jest.Mock

    act(() => {
      testHook(() => {
        useFetchTimepoints(selectedRouteIds, timepointsByRouteId, mockDispatch)
      })
    })

    expect(mockFetchTimepoints).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
  })
})
