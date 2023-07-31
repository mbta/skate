import { Socket } from "phoenix"
import { PropertyLimits } from "../models/searchQuery"
import { Loading, Ok } from "../util/fetchResult"
import {
  LimitedSearchResults,
  useLimitedSearchResults,
} from "./useSearchResults"
import { useLocationSearchResults } from "./useLocationSearchResults"
import { LocationSearchResult } from "../models/locationSearchResult"
import { Vehicle, Ghost } from "../realtime"

export type VehicleResultType =
  | Ok<LimitedSearchResults<Vehicle | Ghost>>
  | Loading
  | null

type LocationResultsType =
  | Ok<LimitedSearchResults<LocationSearchResult>>
  | Loading
  | null

export type SearchResultsByProperty = {
  vehicle: VehicleResultType
  operator: VehicleResultType
  run: VehicleResultType
  location: LocationResultsType
}

const useSearchResultsByProperty = (
  socket: Socket | undefined,
  text: string,
  properties: PropertyLimits
): SearchResultsByProperty => {
  // To avoid conditionally calling hooks, call hook to fetch results for each property, conditionally passing null
  // param when the property limit is null so that no results will actually be fetched & returned.
  const rawLocationResults = useLocationSearchResults(
    (properties.location && text) || null
  )

  const limitedLocationResults: LocationResultsType =
    properties.location === null
      ? null
      : (rawLocationResults && {
          ok: {
            matches: rawLocationResults.slice(0, properties.location || 0),
            hasMoreMatches:
              rawLocationResults.length > (properties.location || 0),
          },
        }) || { is_loading: true }
  return {
    vehicle: useLimitedSearchResults(
      socket,
      (properties.vehicle && {
        property: "vehicle",
        text: text,
        limit: properties.vehicle,
      }) ||
        null
    ),
    operator: useLimitedSearchResults(
      socket,
      (properties.operator && {
        property: "operator",
        text: text,
        limit: properties.operator,
      }) ||
        null
    ),
    run: useLimitedSearchResults(
      socket,
      (properties.run && {
        property: "run",
        text: text,
        limit: properties.run,
      }) ||
        null
    ),
    location: limitedLocationResults,
  }
}

export default useSearchResultsByProperty
