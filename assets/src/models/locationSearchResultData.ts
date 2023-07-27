import { Infer, nullable, number, string, type } from "superstruct"
import { LocationSearchResult } from "./locationSearchResult"

export const LocationSearchResultData = type({
  id: string(),
  name: nullable(string()),
  address: string(),
  latitude: number(),
  longitude: number(),
})
export type LocationSearchResultData = Infer<typeof LocationSearchResultData>

export const locationSearchResultFromData = ({
  id,
  name,
  address,
  latitude,
  longitude,
}: LocationSearchResultData): LocationSearchResult => ({
  id,
  name,
  address,
  latitude,
  longitude,
})

export const locationSearchResultsFromData = (
  locationSearchResultsData: LocationSearchResultData[]
): LocationSearchResult[] =>
  locationSearchResultsData.map(locationSearchResultFromData)
