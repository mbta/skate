import { Infer, nullable, string, type } from "superstruct"
import { LocationSearchSuggestion } from "./locationSearchSuggestion"

export const LocationSearchSuggestionData = type({
  text: string(),
  place_id: nullable(string()),
})
export type LocationSearchSuggestionData = Infer<
  typeof LocationSearchSuggestionData
>

export const locationSearchSuggestionFromData = ({
  text,
  place_id,
}: LocationSearchSuggestionData): LocationSearchSuggestion => ({
  text,
  placeId: place_id,
})

export const locationSearchSuggestionsFromData = (
  locationSearchSuggestionsData: LocationSearchSuggestionData[]
): LocationSearchSuggestion[] =>
  locationSearchSuggestionsData.map(locationSearchSuggestionFromData)
