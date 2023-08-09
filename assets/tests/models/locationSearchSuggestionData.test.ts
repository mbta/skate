import {
  locationSearchSuggestionFromData,
  locationSearchSuggestionsFromData,
} from "../../src/models/locationSearchSuggestionData"
import locationSearchSuggestionFactory from "../factories/locationSearchSuggestion"
import locationSearchSuggestionDataFactory from "../factories/locationSearchSuggestionData"

describe("locationSearchSuggestionFromData", () => {
  test("passes supplied data through", () => {
    const data = locationSearchSuggestionDataFactory.build({
      text: "Some Landmark",
      place_id: "test-id",
    })

    expect(locationSearchSuggestionFromData(data)).toEqual(
      locationSearchSuggestionFactory.build({
        text: "Some Landmark",
        placeId: "test-id",
      })
    )
  })
})

describe("locationSearchSuggestionsFromData", () => {
  test("passes supplied data through", () => {
    const data = [
      locationSearchSuggestionDataFactory.build({
        text: "Some Landmark",
        place_id: "test-id",
      }),
    ]

    expect(locationSearchSuggestionsFromData(data)).toEqual([
      locationSearchSuggestionFactory.build({
        text: "Some Landmark",
        placeId: "test-id",
      }),
    ])
  })
})
