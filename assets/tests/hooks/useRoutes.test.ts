import { jest, describe, test, expect } from "@jest/globals"
import { renderHook } from "@testing-library/react"
import * as Api from "../../src/api"
import useRoutes from "../../src/hooks/useRoutes"
import { instantPromise } from "../testHelpers/mockHelpers"

jest.mock("../../src/api", () => ({
  __esModule: true,

  fetchRoutes: jest.fn(() => new Promise(() => {})),
}))

describe("useRoutes", () => {
  test("returns null while loading", () => {
    const mockFetchRoutes: jest.Mock = Api.fetchRoutes as jest.Mock
    const { result } = renderHook(() => {
      return useRoutes()
    })
    expect(mockFetchRoutes).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual(null)
  })

  test("returns result when loaded", () => {
    const routes = [{ id: "1" }]
    const mockFetchRoutes: jest.Mock = Api.fetchRoutes as jest.Mock
    mockFetchRoutes.mockImplementationOnce(() => instantPromise(routes))
    const { result } = renderHook(() => {
      return useRoutes()
    })
    expect(mockFetchRoutes).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual(routes)
  })

  test("doesn't refetch routes on every render", () => {
    const mockFetchRoutes: jest.Mock = Api.fetchRoutes as jest.Mock
    const { rerender } = renderHook(() => {
      useRoutes()
    })
    rerender()
    expect(mockFetchRoutes).toHaveBeenCalledTimes(1)
  })
})
