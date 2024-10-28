import {
  Infer,
  number,
  type,
  string,
  enums,
  optional,
  array,
  nullable,
} from "superstruct"
import { Stop } from "../schedule"

export enum LocationType {
  Stop = "stop",
  Station = "station",
}

// https://developers.google.com/transit/gtfs/reference#routestxt
export enum RouteType {
  LightRail = 0,
  Subway = 1,
  Rail = 2,
  Bus = 3,
  Ferry = 4,
  CableTram = 5,
  AerialLift = 6,
  Funicular = 7,
  TrolleyBus = 11,
  Monorail = 12,
}

export const StopData = type({
  id: string(),
  name: string(),
  lat: number(),
  lon: number(),
  location_type: enums(["station", "stop"]),
  vehicle_type: optional(nullable(enums([0, 1, 2, 3, 4, 5, 6, 7, 11, 12]))),
  routes: optional(
    array(
      type({
        type: number(),
        id: string(),
        name: string(),
      })
    )
  ),
})
export type StopData = Infer<typeof StopData>

export const stopFromData = (stopData: StopData): Stop => ({
  id: stopData.id,
  name: stopData.name,
  lat: stopData.lat,
  lon: stopData.lon,
  locationType:
    stopData.location_type === "station"
      ? LocationType.Station
      : LocationType.Stop,
  vehicleType: stopData.vehicle_type || null,
  routes: stopData.routes,
})

export const stopsFromData = (stopsData: StopData[]): Stop[] =>
  stopsData.map(stopFromData)
