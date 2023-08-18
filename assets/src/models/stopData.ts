import {
  Infer,
  number,
  type,
  string,
  enums,
  optional,
  array,
} from "superstruct"
import { Stop } from "../schedule"

export enum LocationType {
  Stop = "stop",
  Station = "station",
}

export const StopData = type({
  id: string(),
  name: string(),
  lat: number(),
  lon: number(),
  location_type: enums(["station", "stop"]),
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

export const stopsFromData = (stopsData: StopData[]): Stop[] =>
  stopsData.map((stopData) => ({
    id: stopData.id,
    name: stopData.name,
    lat: stopData.lat,
    lon: stopData.lon,
    locationType:
      stopData.location_type === "station"
        ? LocationType.Station
        : LocationType.Stop,
    routes: stopData.routes,
  }))
