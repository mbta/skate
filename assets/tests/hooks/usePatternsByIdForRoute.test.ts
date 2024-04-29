import { jest, describe, test, expect, beforeEach } from "@jest/globals"
import { act, renderHook, waitFor } from "@testing-library/react"
import * as Api from "../../src/api"
import usePatternsByIdForRoute from "../../src/hooks/usePatternsByIdForRoute"
import { routePatternFactory } from "../factories/routePattern"
import { instantPromise } from "../testHelpers/mockHelpers"
import { PromiseWithResolvers } from "../testHelpers/PromiseWithResolvers"
import routeFactory from "../factories/route"

jest.mock("../../src/api")

beforeEach(() => {
  jest.mocked(Api.fetchRoutePatterns).mockReturnValue(new Promise(() => {}))
})

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

  test("returns result when loaded", async () => {
    const routePatterns = routePatternFactory.buildList(2, { routeId: "66" })
    const [rp1, rp2] = routePatterns
    const mockFetchRoutePatterns: jest.Mock =
      Api.fetchRoutePatterns as jest.Mock
    mockFetchRoutePatterns.mockReturnValueOnce(instantPromise(routePatterns))
    const { result } = renderHook(() => {
      return usePatternsByIdForRoute("66")
    })
    expect(mockFetchRoutePatterns).toHaveBeenCalledTimes(1)
    await waitFor(() =>
      expect(result.current).toEqual({ [rp1.id]: rp1, [rp2.id]: rp2 })
    )
  })

  test("doesn't fetch routes when passed null id", async () => {
    const mockFetchRoutePatterns: jest.Mock =
      Api.fetchRoutePatterns as jest.Mock
    mockFetchRoutePatterns.mockReturnValueOnce(
      instantPromise([routePatternFactory.buildList(2)])
    )
    const { rerender } = renderHook(() => {
      return usePatternsByIdForRoute(null)
    })
    rerender()
    await waitFor(() => expect(mockFetchRoutePatterns).toHaveBeenCalledTimes(0))
  })

  test("doesn't refetch routes on every render", async () => {
    jest
      .mocked(Api.fetchRoutePatterns)
      .mockResolvedValueOnce(routePatternFactory.buildList(2))

    const { rerender, result } = renderHook(usePatternsByIdForRoute, {
      initialProps: "66",
    })

    rerender("66")

    await waitFor(() => expect(result.current).not.toBeNull())
    expect(jest.mocked(Api.fetchRoutePatterns)).toHaveBeenCalledTimes(1)
  })

  test("refetches when routeId changes", async () => {
    const { rerender } = renderHook(usePatternsByIdForRoute, {
      initialProps: "66",
    })

    expect(jest.mocked(Api.fetchRoutePatterns)).toHaveBeenLastCalledWith("66")

    rerender("39")

    expect(jest.mocked(Api.fetchRoutePatterns)).toHaveBeenLastCalledWith("39")
  })

  test("Keeps most recently requested route patterns if previous resolves finishes later", async () => {
    const { promise, resolve } =
      PromiseWithResolvers<Awaited<ReturnType<typeof Api.fetchRoutePatterns>>>()

    const patternFor39 = routePatternFactory.build({ routeId: "39" })
    const patternsFor39ById = { [patternFor39.id]: patternFor39 }

    const routeId1 = routeFactory.build()

    jest.mocked(Api.fetchRoutePatterns).mockReturnValue(promise)

    const { rerender, result } = renderHook(usePatternsByIdForRoute, {
      initialProps: routeId1.id,
    })

    expect(jest.mocked(Api.fetchRoutePatterns)).toHaveBeenLastCalledWith(
      routeId1.id
    )

    expect(result.current).toBeNull()

    jest.mocked(Api.fetchRoutePatterns).mockResolvedValue([patternFor39])

    rerender("39")

    expect(jest.mocked(Api.fetchRoutePatterns)).toHaveBeenLastCalledWith("39")
    await waitFor(() => expect(result.current).toEqual(patternsFor39ById))

    act(() =>
      resolve(routePatternFactory.buildList(2, { routeId: routeId1.id }))
    )

    await waitFor(() => expect(result.current).toEqual(patternsFor39ById))
  })
})
