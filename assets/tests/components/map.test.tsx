import Leaflet from "leaflet"
import React from "react"
import renderer from "react-test-renderer"
import Map, { updateMap } from "../../src/components/map"
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
    const icons = {
      [vehicle.id]: Leaflet.marker([43, -72]).addTo(map),
    }
    const labels = {
      [vehicle.id]: Leaflet.marker([43, -72]).addTo(map),
    }
    updateMap(
      { vehicles: [vehicle], centerOnVehicle: vehicle.id },
      { map, icons, labels },
      VehicleLabelSetting.RunNumber
    )
    expect(map.getCenter()).toEqual({ lat: 42, lng: -71 })
    expect(icons[vehicle.id].getLatLng()).toEqual({ lat: 42, lng: -71 })
    expect(icons[vehicle.id].getLatLng()).toEqual({ lat: 42, lng: -71 })
  })
})
