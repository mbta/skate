import {
  LocationSearchResultData,
  locationSearchResultFromData,
} from "../../src/models/locationSearchResultData"

describe("locationSearchResultFromData", () => {
  test("passes supplied data through", () => {
    const data: LocationSearchResultData = {
      name: "Some Landmark",
      address: "123 Test St",
      latitude: 1,
      longitude: 2,
    }

    expect(locationSearchResultFromData(data)).toEqual({
      name: "Some Landmark",
      address: "123 Test St",
      latitude: 1,
      longitude: 2,
    })
  })
})
