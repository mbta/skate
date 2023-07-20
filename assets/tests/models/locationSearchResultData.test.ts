import {
  locationSearchResultFromData,
  locationSearchResultsFromData,
} from "../../src/models/locationSearchResultData"
import locationSearchResultFactory from "../factories/locationSearchResult"
import locationSearchResultDataFactory from "../factories/locationSearchResultData"

describe("locationSearchResultFromData", () => {
  test("passes supplied data through", () => {
    const data = locationSearchResultDataFactory.build({
      name: "Some Landmark",
      address: "123 Test St",
      latitude: 1,
      longitude: 2,
    })

    expect(locationSearchResultFromData(data)).toEqual(
      locationSearchResultFactory.build({
        name: "Some Landmark",
        address: "123 Test St",
        latitude: 1,
        longitude: 2,
      })
    )
  })
})

describe("locationSearchResultsFromData", () => {
  test("passes supplied data through", () => {
    const data = [
      locationSearchResultDataFactory.build({
        name: "Some Landmark",
        address: "123 Test St",
        latitude: 1,
        longitude: 2,
      }),
    ]

    expect(locationSearchResultsFromData(data)).toEqual([
      locationSearchResultFactory.build({
        name: "Some Landmark",
        address: "123 Test St",
        latitude: 1,
        longitude: 2,
      }),
    ])
  })
})
