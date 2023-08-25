import { describe, test, expect } from "@jest/globals"
import {
  LocationType,
  RouteType,
  StopData,
  stopsFromData,
} from "../../src/models/stopData"
import stopDataFactory from "../factories/stopData"

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
        vehicle_type: 3,
        lat: 42.2,
        lon: -71.2,
      },
    ]

    expect(stopsFromData(data)).toEqual([
      {
        id: "station-1",
        name: "Station 1",
        locationType: LocationType.Station,
        vehicleType: null,
        lat: 42.1,
        lon: -71.1,
        routes: undefined,
      },
      {
        id: "stop-2",
        name: "Stop 2",
        locationType: LocationType.Stop,
        vehicleType: RouteType.Bus,
        lat: 42.2,
        lon: -71.2,
        routes: undefined,
      },
    ])
  })

  test("when stopData includes routes, then includes routes", () => {
    const stop = stopDataFactory.build({
      routes: [{ id: "route_1", name: "Route 1", type: 3 }],
    })

    expect(stopsFromData([stop])).toEqual([
      {
        id: stop.id,
        name: stop.name,
        locationType: stop.location_type,
        vehicleType: null,
        lat: stop.lat,
        lon: stop.lon,
        routes: stop.routes,
      },
    ])
  })
})
