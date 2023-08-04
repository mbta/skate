import { Socket } from "phoenix"
import {
  CategoryResultLimits,
  SearchPropertyQuery,
} from "../models/searchQuery"
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

export type SearchResultsByCategory = {
  vehicle: VehicleResultType
  location: LocationResultsType
}

const useSearchResultsByCategory = (
  socket: Socket | undefined,
  text: string,
  queryType: SearchPropertyQuery,
  categoryLimits: CategoryResultLimits
): SearchResultsByCategory => {
  // To avoid conditionally calling hooks, call hook to fetch results for each property, conditionally passing null
  // param when the property limit is null so that no results will actually be fetched & returned.
  const shouldSearchLocation = queryType === "all" || queryType === "location"
  const shouldSearchVehicles = queryType === "all" || queryType !== "location"
  const rawLocationResults = useLocationSearchResults(
    (shouldSearchLocation && text) || null
  )

  const limitedLocationResults: LocationResultsType = !shouldSearchLocation
    ? null
    : (rawLocationResults && {
        ok: {
          matches: rawLocationResults.slice(0, categoryLimits.location),
          hasMoreMatches: rawLocationResults.length > categoryLimits.location,
        },
      }) || { is_loading: true }
  return {
    vehicle: useLimitedSearchResults(
      socket,
      (shouldSearchVehicles && {
        property: queryType,
        text: text,
        limit: categoryLimits.vehicle,
      }) ||
        null
    ),
    location: limitedLocationResults,
  }
}

export default useSearchResultsByCategory
