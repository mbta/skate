import { Socket } from "phoenix"
import { Infer, array, boolean, type, union } from "superstruct"
import { VehiclePropertyQuery } from "../models/searchQuery"
import {
  GhostData,
  VehicleData,
  vehicleOrGhostFromData,
} from "../models/vehicleData"
import { Ghost, Vehicle } from "../realtime"
import { useCheckedTwoWayChannel } from "./useChannel"
import { useEffect } from "react"
import { Loading, Ok } from "../util/fetchResult"

const parser = (data: (VehicleData | GhostData)[]): (Vehicle | Ghost)[] =>
  data.map(vehicleOrGhostFromData)

const dataStruct = array(union([VehicleData, GhostData]))

const limitedVehicleSearchResultsData = type({
  matching_vehicles: dataStruct,
  has_more_matches: boolean(),
})

type LimitedSearchResultsData = Infer<typeof limitedVehicleSearchResultsData>
export type LimitedSearchResults<T> = {
  matches: T[]
  hasMoreMatches: boolean
}

const parseLimitedSearchResults = (
  data: LimitedSearchResultsData
): Ok<LimitedSearchResults<Vehicle | Ghost>> => ({
  ok: {
    matches: parser(data.matching_vehicles),
    hasMoreMatches: data.has_more_matches,
  },
})

const loadingState: Loading = { is_loading: true }

export const useLimitedSearchResults = (
  socket: Socket | undefined,
  query: { property: VehiclePropertyQuery; text: string; limit: number } | null
): Ok<LimitedSearchResults<Vehicle | Ghost>> | Loading | null => {
  const topic: string | null =
    query?.text && query.text != ""
      ? `vehicles_search:limited:${query.property}:${query.text}`
      : null

  const [state, pushUpdate] = useCheckedTwoWayChannel<
    LimitedSearchResultsData,
    Ok<LimitedSearchResults<Vehicle | Ghost>> | Loading,
    { limit: number }
  >({
    socket,
    topic: topic,
    event: "search",
    dataStruct: limitedVehicleSearchResultsData,
    parser: parseLimitedSearchResults,
    loadingState: loadingState,
  })

  useEffect(() => {
    if (query?.limit) {
      pushUpdate("update_search_query", {
        limit: query.limit,
      })
    }
  }, [query?.limit, pushUpdate])

  return topic ? state : null
}
