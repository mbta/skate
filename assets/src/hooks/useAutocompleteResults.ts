import { Socket } from "phoenix"

import { SearchProperties, SearchProperty } from "../models/searchQuery"
import { Ghost, Vehicle } from "../realtime"
import {
  LimitedSearchResults,
  useLimitedSearchResults,
} from "./useSearchResults"

type AutocompleteResults = Record<
  Exclude<SearchProperty, "location">,
  (Vehicle | Ghost)[]
>

/**
 * A hook to search for multiple properties at once for use in Autocomplete.
 * @param searchText The text to search for.
 * @param searchFilters The properties to search for.
 * @param maxResults The max number of results to return per property.
 * @returns An object containing the results of the search for each property.
 * Filtered properties return an empty list
 */
export const useAutocompleteResults = (
  socket: Socket | undefined,
  searchText: string,
  searchFilters: SearchProperties<boolean>,
  maxResults = 5
): AutocompleteResults => {
  // Search for all the properties we need to return, but if it's filtered,
  // set `query` parameter to `null`
  // If there are no results, use fallback containing zero results.
  const { matchingVehicles: operator } = useLimitedSearchResultsForProperty(
    searchFilters.operator,
    "operator"
  )

  const { matchingVehicles: vehicle } = useLimitedSearchResultsForProperty(
    searchFilters.vehicle,
    "vehicle"
  )

  const { matchingVehicles: run } = useLimitedSearchResultsForProperty(
    searchFilters.run,
    "run"
  )

  return {
    vehicle,
    run,
    operator,
  }

  function useLimitedSearchResultsForProperty(
    enableSearch: boolean,
    property: SearchProperty
  ) {
    const fallback: LimitedSearchResults = {
      hasMoreMatches: false,
      matchingVehicles: [],
    }
    return (
      useLimitedSearchResults(
        socket,
        (enableSearch || null) && {
          property,
          text: searchText,
          limit: maxResults,
        }
      ) || fallback
    )
  }
}
