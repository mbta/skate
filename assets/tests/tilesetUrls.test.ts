import { jest, describe, test, expect } from "@jest/globals"
import appData from "../src/appData"
import { tilesetUrlForType } from "../src/tilesetUrls"

jest.mock("appData")

describe("tilesetUrlForType", () => {
  test("returns the url of the requested type", () => {
    const satelliteUrl = "satellite_url"
    const baseUrl = "base_url"
    ;(appData as jest.Mock).mockImplementation(() => ({
      tilesetUrls: JSON.stringify({
        base: baseUrl,
        satellite: satelliteUrl,
      }),
    }))
    expect(tilesetUrlForType("base")).toEqual(baseUrl)
    expect(tilesetUrlForType("satellite")).toEqual(satelliteUrl)
  })

  test("returns undefined if config is missing", () => {
    ;(appData as jest.Mock).mockImplementation(() => undefined)

    expect(tilesetUrlForType("satellite")).toEqual(undefined)
    expect(tilesetUrlForType("base")).toEqual(undefined)
  })
})
