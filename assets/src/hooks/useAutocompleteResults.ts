import { Socket } from "phoenix"

import {
  SearchProperties,
  SearchProperty,
  VehiclePropertyQuery,
} from "../models/searchQuery"
import { Ghost, Vehicle } from "../realtime"
import { useLimitedSearchResults } from "./useSearchResults"
import { isLoading } from "../util/fetchResult"

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
  const operator = useLimitedSearchResultsForProperty(
    searchFilters.operator,
    "operator"
  )

  const vehicle = useLimitedSearchResultsForProperty(
    searchFilters.vehicle,
    "vehicle"
  )

  const run = useLimitedSearchResultsForProperty(searchFilters.run, "run")

  return {
    vehicle,
    run,
    operator,
  }

  function useLimitedSearchResultsForProperty(
    enableSearch: boolean,
    property: VehiclePropertyQuery
  ): (Vehicle | Ghost)[] {
    // Search for the property we need to return, but if it's filtered,
    // set `query` parameter to `null`
    const res = useLimitedSearchResults(
      socket,
      (enableSearch || null) && {
        property,
        text: searchText,
        limit: maxResults,
      }
    )

    // If there are no results, or is loading, use empty array as fallback.
    if (!res || isLoading(res)) {
      return []
    }

    return res.ok.matches
  }
}
