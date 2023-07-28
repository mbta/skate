import { useContext } from "react"

import { SocketContext } from "../contexts/socketContext"
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
  searchText: string,
  searchFilters: SearchProperties<boolean>,
  maxResults = 5
): AutocompleteResults => {
  const { socket } = useContext(SocketContext)

  const fallback: LimitedSearchResults = {
    hasMoreMatches: false,
    matchingVehicles: [],
  }

  // Search for all the properties we need to return, but if it's filtered,
  // set `query` parameter to `null`
  // If there are no results, use fallback containing zero results.
  const { matchingVehicles: operator } =
    useLimitedSearchResults(
      socket,
      (searchFilters.vehicle || null) && {
        property: "operator",
        text: searchText,
        limit: maxResults,
      }
    ) || fallback

  const { matchingVehicles: vehicle } =
    useLimitedSearchResults(
      socket,
      (searchFilters.run || null) && {
        property: "vehicle",
        text: searchText,
        limit: maxResults,
      }
    ) || fallback

  const { matchingVehicles: run } =
    useLimitedSearchResults(
      socket,
      (searchFilters.operator || null) && {
        property: "run",
        text: searchText,
        limit: maxResults,
      }
    ) || fallback

  return {
    vehicle,
    run,
    operator,
  }
}
