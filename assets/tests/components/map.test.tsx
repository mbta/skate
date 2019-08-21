import Leaflet from "leaflet"
import React from "react"
import renderer from "react-test-renderer"
import Map, { updateMap, updateMarkers } from "../../src/components/map"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import { Vehicle } from "../../src/realtime"
import { VehicleLabelSetting } from "../../src/settings"

const vehicle: Vehicle = {
  id: "y1818",
  label: "1818",
  runId: "run-1",
  timestamp: 123,
  latitude: 42.0,
  longitude: -71.0,
  directionId: 0,
  routeId: "39",
  tripId: "t1",
  headsign: "Forest Hills",
  viaVariant: "X",
  operatorId: "op1",
  operatorName: "SMITH",
  bearing: 33,
  speed: 50.0,
  blockId: "block-1",
  headwaySecs: 859.1,
  headwaySpacing: HeadwaySpacing.Ok,
  previousVehicleId: "v2",
  scheduleAdherenceSecs: 0,
  scheduleAdherenceString: "0.0 sec (ontime)",
  scheduleAdherenceStatus: "early",
  scheduledHeadwaySecs: 120,
  isOffCourse: false,
  isLayingOver: false,
  layoverDepartureTime: null,
  blockIsActive: false,
  dataDiscrepancies: [
    {
      attribute: "trip_id",
      sources: [
        {
          id: "swiftly",
          value: "swiftly-trip-id",
        },
        {
          id: "busloc",
          value: "busloc-trip-id",
        },
      ],
    },
  ],
  stopStatus: {
    status: "in_transit_to",
    stopId: "s1",
    stopName: "Stop Name",
  },
  timepointStatus: {
    fractionUntilTimepoint: 0.5,
    timepointId: "tp1",
  },
  scheduledLocation: null,
  isOnRoute: true,
}

describe("map", () => {
  test("renders", () => {
    const tree = renderer
      .create(<Map vehicles={[vehicle]} centerOnVehicle={vehicle.id} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe("updateMap", () => {
  test("updates lat/lng values for map & markers", () => {
    document.body.innerHTML = "<div id='map'></div>"
    const map = Leaflet.map("map", {})
    const markers = {
      [vehicle.id]: {
        icon: Leaflet.marker([43, -72]).addTo(map),
        label: Leaflet.marker([43, -72]).addTo(map),
      },
    }
    updateMap(
      { vehicles: [vehicle], centerOnVehicle: vehicle.id },
      { map, markers },
      VehicleLabelSetting.RunNumber
    )
    expect(map.getCenter()).toEqual({ lat: 42, lng: -71 })
    expect(markers[vehicle.id].icon.getLatLng()).toEqual({ lat: 42, lng: -71 })
    expect(markers[vehicle.id].label.getLatLng()).toEqual({ lat: 42, lng: -71 })
  })
})

describe("updateMarkers", () => {
  test("adds a new marker set for a vehicle if it doesn't exist", () => {
    document.body.innerHTML = "<div id='map'></div>"
    const map = Leaflet.map("map", {})
    const vehicles = {
      [vehicle.id]: vehicle,
    }

    const icons = updateMarkers(vehicles, {}, map)

    expect(Object.keys(icons)).toEqual([vehicle.id])
    expect(icons[vehicle.id]!.icon.getLatLng()).toEqual({
      lat: vehicle.latitude,
      lng: vehicle.longitude,
    })
    expect(icons[vehicle.id]!.label.getLatLng()).toEqual({
      lat: vehicle.latitude,
      lng: vehicle.longitude,
    })
  })

  test("removes icon if it is not in the list of current vehicles", () => {
    document.body.innerHTML = "<div id='map'></div>"
    const map = Leaflet.map("map", {})
    const existingVehicles = {
      [vehicle.id]: {
        label: Leaflet.marker([vehicle.latitude, vehicle.longitude]).addTo(map),
        icon: Leaflet.marker([vehicle.latitude, vehicle.longitude]).addTo(map),
      },
    }

    const icons = updateMarkers({}, existingVehicles, map)
    expect(icons[vehicle.id]).toBe(null)
  })

  test("keeps existing icons", () => {
    document.body.innerHTML = "<div id='map'></div>"
    const map = Leaflet.map("map", {})
    const icon = Leaflet.marker([vehicle.latitude, vehicle.longitude]).addTo(
      map
    )

    const label = Leaflet.marker([vehicle.latitude, vehicle.longitude]).addTo(
      map
    )

    const icons = updateMarkers(
      { [vehicle.id]: vehicle },
      { [vehicle.id]: { label, icon } },
      map
    )

    expect(icons[vehicle.id]).toEqual({ label, icon })
  })
})
