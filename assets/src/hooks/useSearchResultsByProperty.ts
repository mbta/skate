import { Socket } from "phoenix"
import { PropertyLimits } from "../models/searchQuery"
import { Loading, Ok } from "../util/fetchResult"
import {
  LimitedSearchResults,
  useLimitedSearchResults,
} from "./useSearchResults"

const useSearchResultsByProperty = (
  socket: Socket | undefined,
  text: string,
  properties: PropertyLimits
): {
  vehicle: Ok<LimitedSearchResults> | Loading | null
  operator: Ok<LimitedSearchResults> | Loading | null
  run: Ok<LimitedSearchResults> | Loading | null
  location: Ok<LimitedSearchResults> | Loading | null
} => {
  // To avoid conditionally calling hooks, use search result hooks for each property.
  // Conditionally use the results only if the limit is present
  const vehicleResults = useLimitedSearchResults(
    socket,
    properties.vehicle === null
      ? null
      : { property: "vehicle", text: text, limit: properties.vehicle }
  )
  const operatorResults = useLimitedSearchResults(
    socket,
    properties.operator === null
      ? null
      : { property: "operator", text: text, limit: properties.operator }
  )

  const runResults = useLimitedSearchResults(
    socket,
    properties.run === null
      ? null
      : { property: "run", text: text, limit: properties.run }
  )
  return {
    vehicle: properties.vehicle === null ? null : vehicleResults,
    operator: properties.operator === null ? null : operatorResults,
    run: properties.run === null ? null : runResults,
    location: null,
  }
}

export default useSearchResultsByProperty
