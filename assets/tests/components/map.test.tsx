import Leaflet from "leaflet"
import React from "react"
import renderer from "react-test-renderer"
import Map, { mapOptions, updateMap } from "../../src/components/map"

describe("map", () => {
  test("renders", () => {
    const tree = renderer
      .create(
        <Map
          bearing={33}
          latitude={42.0}
          longitude={-71.0}
          label={"1818"}
          scheduleAdherenceStatus={"early"}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe("updateMap", () => {
  test("updates lat/lng values for map & markers", () => {
    document.body.innerHTML = "<div id='map'></div>"
    const map = Leaflet.map("map", mapOptions)
    const vehicleIcon = Leaflet.marker([43, -72]).addTo(map)
    const vehicleLabel = Leaflet.marker([43, -72])
    updateMap(
      {
        bearing: 33,
        label: "1818",
        latitude: 42,
        longitude: -71,
        scheduleAdherenceStatus: "on-time",
      },
      { map, vehicleIcon, vehicleLabel }
    )
    expect(map.getCenter()).toEqual({ lat: 42, lng: -71 })
    expect(vehicleIcon.getLatLng()).toEqual({ lat: 42, lng: -71 })
    expect(vehicleLabel.getLatLng()).toEqual({ lat: 42, lng: -71 })
  })
})
