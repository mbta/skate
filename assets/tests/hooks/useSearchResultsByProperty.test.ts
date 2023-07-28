import { renderHook } from "@testing-library/react"
import { useLimitedSearchResults } from "../../src/hooks/useSearchResults"
import { makeMockSocket } from "../testHelpers/socketHelpers"
import vehicleFactory from "../factories/vehicle"
import useSearchResultsByProperty from "../../src/hooks/useSearchResultsByProperty"

jest.mock("../../src/hooks/useSearchResults", () => ({
  __esModule: true,
  useLimitedSearchResults: jest.fn(() => null),
}))
const runMatch = vehicleFactory.build()
const operatorMatch = vehicleFactory.build()

describe("useSearchResultsByProperty", () => {
  test("returns results only for the properties that have limits set", () => {
    const mockSocket = makeMockSocket()
    ;(useLimitedSearchResults as jest.Mock).mockImplementation(
      (_socket, query) => {
        switch (query?.property) {
          case "vehicle":
            return { is_loading: true }
          case "run":
            return {
              ok: { matchingVehicles: [runMatch], hasMoreMatches: false },
            }
          case "operator":
            return {
              ok: { matchingVehicles: [operatorMatch], hasMoreMatches: true },
            }
          default:
            return null
        }
      }
    )

    const { result } = renderHook(() =>
      useSearchResultsByProperty(mockSocket, "1234", {
        vehicle: 5,
        run: null,
        operator: 5,
        location: 5,
      })
    )
    expect(result.current).toEqual({
      vehicle: { is_loading: true },
      run: null,
      operator: {
        ok: { matchingVehicles: [operatorMatch], hasMoreMatches: true },
      },
      location: null,
    })
  })
})
