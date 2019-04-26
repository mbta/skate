import { act } from "react-test-renderer"
import * as Api from "../../src/api"
import { useFetchRoutes } from "../../src/hooks/useFetchRoutes"
import { testHook } from "../testHelpers/testHook"

// tslint:disable: react-hooks-nesting no-empty

jest.mock("../../src/api", () => ({
  __esModule: true,
  fetchRoutes: jest.fn(() => new Promise(() => {})),
}))

describe("useFetchRoutes", () => {
  test("fetches routes", () => {
    const mockFetchRoutes: jest.Mock = Api.fetchRoutes as jest.Mock
    act(() => {
      testHook(() => {
        useFetchRoutes(jest.fn())
      })
    })
    expect(mockFetchRoutes).toHaveBeenCalledTimes(1)
  })

  test("doesn't refetch routes on every render", () => {
    const mockFetchRoutes: jest.Mock = Api.fetchRoutes as jest.Mock
    act(() => {
      const component = testHook(() => {
        useFetchRoutes(jest.fn())
      })
      // Force a rerender
      component.setProps({})
    })
    expect(mockFetchRoutes).toHaveBeenCalledTimes(1)
  })
})
