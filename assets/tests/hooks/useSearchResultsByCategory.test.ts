import { jest, describe, test, expect, afterEach } from "@jest/globals"
import { renderHook } from "@testing-library/react"
import { useSearchResults } from "../../src/hooks/useSearchResults"
import { makeMockSocket } from "../testHelpers/socketHelpers"
import vehicleFactory from "../factories/vehicle"
import useSearchResultsByCategory, {
  VehicleResultType,
} from "../../src/hooks/useSearchResultsByCategory"
import locationSearchResultFactory from "../factories/locationSearchResult"
import { useLocationSearchResults } from "../../src/hooks/useLocationSearchResults"
import { LocationSearchResult } from "../../src/models/locationSearchResult"

jest.mock("../../src/hooks/useSearchResults", () => ({
  __esModule: true,
  useSearchResults: jest.fn(() => null),
}))

jest.mock("../../src/hooks/useLocationSearchResults", () => ({
  __esModule: true,
  useLocationSearchResults: jest.fn(() => null),
}))

const vehicleMatch = vehicleFactory.build()
const runMatch = vehicleFactory.build()
const operatorMatch = vehicleFactory.build()
const locationMatch = locationSearchResultFactory.build()

const mockSearchResults = (rawResults: {
  all?: VehicleResultType
  vehicle?: VehicleResultType
  operator?: VehicleResultType
  run?: VehicleResultType
  location?: LocationSearchResult[] | null
}) => {
  ;jest.mocked(useSearchResults).mockImplementation(
    (_socket, query) => {
      switch (query?.property) {
        case "vehicle":
          return rawResults.vehicle || null
        case "run":
          return rawResults.run || null
        case "operator":
          return rawResults.operator || null
        case "all":
          return rawResults.all || null
        default:
          return null
      }
    }
  )
  jest.mocked(useLocationSearchResults).mockReturnValue(rawResults.location)
}

afterEach(() => {
  jest.restoreAllMocks()
})

describe("useSearchResultsByCategory", () => {
  test("when results are loading, returns loading", () => {
    const mockSocket = makeMockSocket()
    mockSearchResults({
      all: { is_loading: true },
      location: null,
    })

    const { result } = renderHook(() =>
      useSearchResultsByCategory(mockSocket, "1234", "all", {
        vehicle: 5,
        location: 5,
      })
    )
    expect(result.current).toEqual({
      vehicle: { is_loading: true },
      location: { is_loading: true },
    })
  })
  test("when query property is 'all', returns all vehicle matches and location matches", () => {
    const mockSocket = makeMockSocket()
    mockSearchResults({
      all: {
        ok: {
          matches: [vehicleMatch, operatorMatch, runMatch],
          hasMoreMatches: true,
        },
      },

      vehicle: {
        ok: { matches: [vehicleFactory.build()], hasMoreMatches: true },
      },
      operator: {
        ok: { matches: [vehicleFactory.build()], hasMoreMatches: true },
      },
      run: { ok: { matches: [vehicleFactory.build()], hasMoreMatches: true } },
      location: [locationMatch],
    })

    const { result } = renderHook(() =>
      useSearchResultsByCategory(mockSocket, "1234", "all", {
        vehicle: 5,
        location: 5,
      })
    )
    expect(result.current).toEqual({
      vehicle: {
        ok: {
          matches: [vehicleMatch, operatorMatch, runMatch],
          hasMoreMatches: true,
        },
      },
      location: {
        ok: { matches: [locationMatch], hasMoreMatches: false },
      },
    })
  })

  test("when query property is a vehicle property, returns only vehicle matches", () => {
    const mockSocket = makeMockSocket()
    mockSearchResults({
      vehicle: { ok: { matches: [vehicleMatch], hasMoreMatches: true } },
      location: [locationMatch],
    })

    const { result } = renderHook(() =>
      useSearchResultsByCategory(mockSocket, "1234", "vehicle", {
        vehicle: 5,
        location: 5,
      })
    )
    expect(result.current).toEqual({
      vehicle: {
        ok: {
          matches: [vehicleMatch],
          hasMoreMatches: true,
        },
      },
      location: null,
    })
  })

  test("when query property is 'location', returns only location matches", () => {
    const mockSocket = makeMockSocket()
    mockSearchResults({
      vehicle: { ok: { matches: [vehicleMatch], hasMoreMatches: true } },
      operator: { ok: { matches: [operatorMatch], hasMoreMatches: true } },
      run: { ok: { matches: [operatorMatch], hasMoreMatches: true } },
      location: [locationMatch],
    })

    const { result } = renderHook(() =>
      useSearchResultsByCategory(mockSocket, "1234", "location", {
        vehicle: 5,
        location: 5,
      })
    )
    expect(result.current).toEqual({
      vehicle: null,
      location: {
        ok: {
          matches: [locationMatch],
          hasMoreMatches: false,
        },
      },
    })
  })
})
