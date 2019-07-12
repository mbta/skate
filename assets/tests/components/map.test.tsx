import { Map as LeafletMap, Marker } from "leaflet"
import React from "react"
import renderer from "react-test-renderer"
import Map, { updateMap } from "../../src/components/map"

describe("map", () => {
  test("renders", () => {
    const tree = renderer
      .create(
        <Map bearing={33} latitude={42.0} longitude={-71.0} label={"1818"} />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe("updateMap", () => {
  test("adds a map if it doesn't exist", () => {
    document.body.innerHTML = "<div id='map'></div>"
    const { map, vehicleMarker, vehicleLabel } = updateMap(
      {
        bearing: 33,
        label: "1818",
        latitude: 42.0,
        longitude: -71.0,
      },
      null,
      null,
      null
    )
    expect(map).toBeInstanceOf(LeafletMap)
    expect(vehicleMarker).toBeInstanceOf(Marker)
    expect(vehicleLabel).toBeInstanceOf(Marker)
  })
})
