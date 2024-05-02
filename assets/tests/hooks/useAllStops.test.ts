import { jest, describe, test, expect } from "@jest/globals"
import { renderHook } from "@testing-library/react"
import { fetchAllStops } from "../../src/api"
import { LocationType } from "../../src/models/stopData"
import { Stop } from "../../src/schedule"
import { instantPromise } from "../testHelpers/mockHelpers"
import { useAllStops } from "../../src/hooks/useAllStops"
import stopFactory from "../factories/stop"

jest.mock("../../src/api", () => ({
  __esModule: true,

  fetchAllStops: jest.fn(() => new Promise<Stop[]>(() => [])),
}))

describe("useAllStops", () => {
  test("returns stops and stations", () => {
    const stops = [
      stopFactory.build({ locationType: LocationType.Stop }),
      stopFactory.build({ locationType: LocationType.Station }),
    ]
    jest.mocked(fetchAllStops).mockReturnValueOnce(instantPromise(stops))

    const { result } = renderHook(() => {
      return useAllStops()
    })

    expect(fetchAllStops).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual(stops)
  })

  test("returns null when data not fetched", () => {
    const { result } = renderHook(() => {
      return useAllStops()
    })

    expect(result.current).toEqual(null)
  })
})
