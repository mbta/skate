import { Infer, nullable, number, string, type } from "superstruct"
import { LocationSearchResult } from "./locationSearchResult"

export const LocationSearchResultData = type({
  name: nullable(string()),
  address: string(),
  latitude: number(),
  longitude: number(),
})
export type LocationSearchResultData = Infer<typeof LocationSearchResultData>

export const locationSearchResultFromData = ({
  name,
  address,
  latitude,
  longitude,
}: LocationSearchResultData): LocationSearchResult => ({
  name,
  address,
  latitude,
  longitude,
})
