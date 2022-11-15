import { streetViewUrl } from "../../src/util/streetViewUrl"

describe("streetViewUrl", () => {
  test("returns a url with the given lat, lon, and bearing", () => {
    expect(
      streetViewUrl({
        latitude: 42.36014757,
        longitude: -71.09505978,
        bearing: 131,
      })
    ).toEqual(
      "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=42.36014757%2C-71.09505978&heading=131&pitch=0&fov=80"
    )
  })

  test("returns without heading param when no bearing given", () => {
    expect(
      streetViewUrl({
        latitude: 42.36014757,
        longitude: -71.09505978,
      })
    ).toEqual(
      "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=42.36014757%2C-71.09505978&pitch=0&fov=80"
    )
  })
})
