import { renderHook } from "@testing-library/react-hooks"
import * as Api from "../../src/api"
import useRoutes from "../../src/hooks/useRoutes"
import { instantPromise } from "../testHelpers/mockHelpers"

// tslint:disable: react-hooks-nesting no-empty

jest.mock("../../src/api", () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
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
