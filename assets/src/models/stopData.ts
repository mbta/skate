import {
  Infer,
  number,
  type,
  string,
  enums,
  array,
  optional,
} from "superstruct"
import { Stop } from "../schedule"

export enum LocationType {
  Stop,
  Station,
}

export const StopData = type({
  id: string(),
  name: string(),
  lat: number(),
  lon: number(),
  location_type: string(),
  routes: optional(
    array(
      type({
        type: number(),
        id: string(),
        name: string(),
      })
    )
  ),
  route_ids: optional(array(string())),
})
export type StopData = Infer<typeof StopData>

export const stopsFromData = (stopsData: StopData[]): Stop[] =>
  stopsData.map((stopData) => {
    console.log(stopData)
    return {
      id: stopData.id,
      name: stopData.name,
      lat: stopData.lat,
      lon: stopData.lon,
      locationType:
        stopData.location_type === "station"
          ? LocationType.Station
          : LocationType.Stop,
      routeIds: stopData.route_ids,
      routes: stopData.routes,
    }
  })
