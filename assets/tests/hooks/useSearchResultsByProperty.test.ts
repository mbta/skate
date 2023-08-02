import { renderHook } from "@testing-library/react"
import { useLimitedSearchResults } from "../../src/hooks/useSearchResults"
import { makeMockSocket } from "../testHelpers/socketHelpers"
import vehicleFactory from "../factories/vehicle"
import useSearchResultsByProperty, {
  VehicleResultType,
} from "../../src/hooks/useSearchResultsByProperty"
import locationSearchResultFactory from "../factories/locationSearchResult"
import { useLocationSearchResults } from "../../src/hooks/useLocationSearchResults"
import { LocationSearchResult } from "../../src/models/locationSearchResult"

jest.mock("../../src/hooks/useSearchResults", () => ({
  __esModule: true,
  useLimitedSearchResults: jest.fn(() => null),
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
  vehicle: VehicleResultType
  operator: VehicleResultType
  run: VehicleResultType
  location: LocationSearchResult[] | null
}) => {
  ;(useLimitedSearchResults as jest.Mock).mockImplementation(
    (_socket, query) => {
      switch (query?.property) {
        case "vehicle":
          return rawResults.vehicle
        case "run":
          return rawResults.run
        case "operator":
          return rawResults.operator
        default:
          return null
      }
    }
  )
  ;(useLocationSearchResults as jest.Mock).mockReturnValue(rawResults.location)
}

afterEach(() => {
  jest.restoreAllMocks()
})

describe("useSearchResultsByProperty", () => {
  test("when property limits are null, returns null", () => {
    const mockSocket = makeMockSocket()
    mockSearchResults({
      vehicle: { ok: { matches: [vehicleMatch], hasMoreMatches: true } },
      operator: { ok: { matches: [operatorMatch], hasMoreMatches: true } },
      run: { ok: { matches: [runMatch], hasMoreMatches: true } },
      location: [locationMatch],
    })

    const { result } = renderHook(() =>
      useSearchResultsByProperty(mockSocket, "1234", {
        vehicle: null,
        run: null,
        operator: null,
        location: null,
      })
    )
    expect(result.current).toEqual({
      vehicle: null,
      run: null,
      operator: null,
      location: null,
    })
  })
  test("when result is loading, returns loading", () => {
    const mockSocket = makeMockSocket()
    mockSearchResults({
      vehicle: { is_loading: true },
      operator: { is_loading: true },
      run: { is_loading: true },
      location: null,
    })

    const { result } = renderHook(() =>
      useSearchResultsByProperty(mockSocket, "1234", {
        vehicle: 5,
        run: 5,
        operator: 5,
        location: 5,
      })
    )
    expect(result.current).toEqual({
      vehicle: { is_loading: true },
      run: { is_loading: true },
      operator: { is_loading: true },
      location: { is_loading: true },
    })
  })
  test("when results are loaded, returns data for each property", () => {
    const mockSocket = makeMockSocket()
    mockSearchResults({
      vehicle: { ok: { matches: [vehicleMatch], hasMoreMatches: true } },
      operator: { ok: { matches: [operatorMatch], hasMoreMatches: true } },
      run: { ok: { matches: [operatorMatch], hasMoreMatches: true } },
      location: [locationMatch],
    })

    const { result } = renderHook(() =>
      useSearchResultsByProperty(mockSocket, "1234", {
        vehicle: 5,
        run: 5,
        operator: 5,
        location: 5,
      })
    )
    expect(result.current).toEqual({
      vehicle: { ok: { matches: [vehicleMatch], hasMoreMatches: true } },
      operator: { ok: { matches: [operatorMatch], hasMoreMatches: true } },
      run: { ok: { matches: [operatorMatch], hasMoreMatches: true } },
      location: {
        ok: { matches: [locationMatch], hasMoreMatches: false },
      },
    })
  })
  test("when some properties have null limits, returns results for all other properties", () => {
    const mockSocket = makeMockSocket()
    mockSearchResults({
      vehicle: { is_loading: true },
      run: {
        ok: { matches: [runMatch], hasMoreMatches: false },
      },
      operator: {
        ok: { matches: [operatorMatch], hasMoreMatches: true },
      },
      location: [locationMatch],
    })

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
        ok: { matches: [operatorMatch], hasMoreMatches: true },
      },
      location: { ok: { matches: [locationMatch], hasMoreMatches: false } },
    })
  })
})
