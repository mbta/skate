import { renderHook } from "@testing-library/react"
import { fetchStations } from "../../src/api"
import { useStations } from "../../src/hooks/useStations"
import { LocationType } from "../../src/models/stopData"
import { Stop } from "../../src/schedule"
import { instantPromise } from "../testHelpers/mockHelpers"

jest.mock("../../src/api", () => ({
  __esModule: true,

  fetchStations: jest.fn(() => new Promise<Stop[]>(() => [])),
}))

describe("useStations", () => {
  test("fetches a shape for a route if we don't have it yet", () => {
    const stations = [
      {
        id: "station-1",
        name: "Station 1",
        locationType: LocationType.Station,
        lat: 42,
        lon: -71,
      },
    ]
    ;(fetchStations as jest.Mock).mockReturnValueOnce(instantPromise(stations))

    const { result } = renderHook(() => {
      return useStations()
    })

    expect(fetchStations).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual(stations)
  })

  test("returns null when data not fetched ", () => {
    const { result } = renderHook(() => {
      return useStations()
    })

    expect(result.current).toEqual(null)
  })
})
