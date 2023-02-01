import { renderHook, waitFor } from "@testing-library/react"
import * as Api from "../../src/api"
import usePatternsByIdForRoute from "../../src/hooks/usePatternsByIdForRoute"
import { routePatternFactory } from "../factories/routePattern"
import { instantPromise } from "../testHelpers/mockHelpers"

jest.mock("../../src/api", () => ({
  __esModule: true,

  fetchRoutePatterns: jest.fn(() => new Promise(() => [])),
}))

describe("usePatternsByIdForRoute", () => {
  test("returns null while loading", () => {
    const mockFetchRoutePatterns: jest.Mock =
      Api.fetchRoutePatterns as jest.Mock
    const { result } = renderHook(() => {
      return usePatternsByIdForRoute("1")
    })
    expect(mockFetchRoutePatterns).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual(null)
  })

  test("returns result when loaded", () => {
    const routePatterns = routePatternFactory.buildList(2, { routeId: "66" })
    const [rp1, rp2] = routePatterns
    const mockFetchRoutePatterns: jest.Mock =
      Api.fetchRoutePatterns as jest.Mock
    mockFetchRoutePatterns.mockReturnValueOnce(instantPromise(routePatterns))
    const { result } = renderHook(() => {
      return usePatternsByIdForRoute("66")
    })
    expect(mockFetchRoutePatterns).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual({ [rp1.id]: rp1, [rp2.id]: rp2 })
  })

  test("doesn't fetch routes when passed null id", () => {
    const mockFetchRoutePatterns: jest.Mock =
      Api.fetchRoutePatterns as jest.Mock
    mockFetchRoutePatterns.mockReturnValueOnce(
      instantPromise([routePatternFactory.buildList(2)])
    )
    const { rerender } = renderHook(() => {
      return usePatternsByIdForRoute(null)
    })
    rerender()
    expect(mockFetchRoutePatterns).toHaveBeenCalledTimes(0)
  })

  test("doesn't refetch routes on every render", () => {
    const mockFetchRoutePatterns: jest.Mock =
      Api.fetchRoutePatterns as jest.Mock
    mockFetchRoutePatterns.mockReturnValueOnce(
      instantPromise([routePatternFactory.buildList(2)])
    )
    const { rerender } = renderHook(() => {
      return usePatternsByIdForRoute("66")
    })
    rerender()
    expect(mockFetchRoutePatterns).toHaveBeenCalledTimes(1)
  })

  test("refetches when routeId changes", () => {
    const mockFetchRoutePatterns: jest.Mock =
      Api.fetchRoutePatterns as jest.Mock
    mockFetchRoutePatterns.mockReturnValueOnce(
      instantPromise([routePatternFactory.buildList(2)])
    )
    const { rerender } = renderHook(
      (id) => {
        return usePatternsByIdForRoute(id)
      },
      { initialProps: "66" }
    )
    expect(mockFetchRoutePatterns).toHaveBeenLastCalledWith("66")
    rerender("39")
    expect(mockFetchRoutePatterns).toHaveBeenLastCalledWith("39")
  })

  test.only("Keeps most recently requested route patterns if previous resolves finishes later", async () => {
    const patternFor66 = routePatternFactory.build({ routeId: "66" })
    // const patternsFor66ById = { [patternFor66.id]: patternFor66 }
    const patternFor39 = routePatternFactory.build({ routeId: "39" })
    const patternsFor39ById = { [patternFor39.id]: patternFor39 }

    let patternsFor66DidResolve = false

    const mockFetchRoutePatterns: jest.Mock =
      Api.fetchRoutePatterns as jest.Mock

    mockFetchRoutePatterns
      .mockReturnValueOnce(
        new Promise((res) =>
          setTimeout(() => {
            patternsFor66DidResolve = true
            return res([patternFor66])
          }, 250)
        )
      )
      .mockReturnValueOnce(instantPromise([patternFor39]))
    const { rerender, result } = renderHook(
      (id) => {
        return usePatternsByIdForRoute(id)
      },
      { initialProps: "66" }
    )
    expect(mockFetchRoutePatterns).toHaveBeenLastCalledWith("66")
    expect(result.current).toBeNull()
    rerender("39")
    expect(mockFetchRoutePatterns).toHaveBeenLastCalledWith("39")
    expect(result.current).toEqual(patternsFor39ById)

    expect(patternsFor66DidResolve).toBe(false)

    await waitFor(() => expect(patternsFor66DidResolve).toBe(true))

    expect(result.current).toEqual(patternsFor39ById)
  })
})
