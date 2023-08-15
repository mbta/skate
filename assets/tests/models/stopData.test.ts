import { describe, test, expect } from "@jest/globals"
import {
  LocationType,
  StopData,
  stopsFromData,
} from "../../src/models/stopData"

describe("stopsFromData", () => {
  test("transforms list of stopData to stops", () => {
    const data: StopData[] = [
      {
        id: "station-1",
        name: "Station 1",
        location_type: "station",
        lat: 42.1,
        lon: -71.1,
      },
      {
        id: "stop-2",
        name: "Stop 2",
        location_type: "stop",
        lat: 42.2,
        lon: -71.2,
      },
    ]

    expect(stopsFromData(data)).toEqual([
      {
        id: "station-1",
        name: "Station 1",
        locationType: LocationType.Station,
        lat: 42.1,
        lon: -71.1,
      },
      {
        id: "stop-2",
        name: "Stop 2",
        locationType: LocationType.Stop,
        lat: 42.2,
        lon: -71.2,
      },
    ])
  })
})
