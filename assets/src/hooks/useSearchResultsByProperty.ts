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

type vehicleResultType =
  | Ok<LimitedSearchResults<Vehicle | Ghost>>
  | Loading
  | null

const useSearchResultsByProperty = (
  socket: Socket | undefined,
  text: string,
  properties: PropertyLimits
): {
  vehicle: vehicleResultType
  operator: vehicleResultType
  run: vehicleResultType
  location: Ok<LimitedSearchResults<LocationSearchResult>> | Loading | null
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

  const locationResults = useLocationSearchResults(text)

  return {
    vehicle: properties.vehicle === null ? null : vehicleResults,
    operator: properties.operator === null ? null : operatorResults,
    run: properties.run === null ? null : runResults,
    location:
      properties.location === null
        ? null
        : locationResults === null
        ? { is_loading: true }
        : {
            ok: {
              matches: locationResults.slice(0, properties.location),
              hasMoreMatches: locationResults.length > properties.location,
            },
          },
  }
}

export default useSearchResultsByProperty
