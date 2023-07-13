import { Socket } from "phoenix"
import { Infer, array, boolean, type, union } from "superstruct"
import { SearchQuery, SearchProperty } from "../models/searchQuery"
import {
  GhostData,
  VehicleData,
  vehicleOrGhostFromData,
} from "../models/vehicleData"
import { Ghost, Vehicle } from "../realtime"
import { useCheckedChannel, useCheckedTwoWayChannel } from "./useChannel"
import { useEffect } from "react"

const parser = (data: (VehicleData | GhostData)[]): (Vehicle | Ghost)[] =>
  data.map(vehicleOrGhostFromData)

const dataStruct = array(union([VehicleData, GhostData]))

const useSearchResults = (
  socket: Socket | undefined,
  searchQuery: SearchQuery | null
): (Vehicle | Ghost)[] | null => {
  const topic: string | null =
    searchQuery && `vehicles:search:${searchQuery.property}:${searchQuery.text}`
  return useCheckedChannel<
    (VehicleData | GhostData)[],
    (Vehicle | Ghost)[] | null
  >({
    socket,
    topic,
    event: "search",
    dataStruct,
    parser,
    loadingState: null,
  })
}

const limitedSearchResultsData = type({
  matching_vehicles: dataStruct,
  has_more_matches: boolean(),
})

type LimitedSearchResultsData = Infer<typeof limitedSearchResultsData>
export type LimitedSearchResults = {
  matchingVehicles: (Vehicle | Ghost)[]
  hasMoreMatches: boolean
}

const parseLimitedSearchResults = (
  data: LimitedSearchResultsData
): LimitedSearchResults => ({
  matchingVehicles: parser(data.matching_vehicles),
  hasMoreMatches: data.has_more_matches,
})

export const useLimitedSearchResults = (
  socket: Socket | undefined,
  query: { property: SearchProperty; text: string; limit: number } | null
): LimitedSearchResults | null => {
  const topic: string | null =
    query && `vehicles_search:limited:${query.property}:${query.text}`
  const [state, pushUpdate] = useCheckedTwoWayChannel<
    LimitedSearchResultsData,
    LimitedSearchResults | null
  >({
    socket,
    topic,
    event: "search",
    dataStruct: limitedSearchResultsData,
    parser: parseLimitedSearchResults,
    loadingState: null,
    initialMessage: query && {
      limit: query.limit,
    },
  })

  useEffect(() => {
    if (query) {
      pushUpdate("update_search_query", {
        limit: query.limit,
      })
    }
  }, [query?.property, query?.text, query?.limit, pushUpdate])

  return state
}

export default useSearchResults
