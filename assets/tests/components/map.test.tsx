import Leaflet from "leaflet"
import React from "react"
import renderer from "react-test-renderer"
import Map, {
  defaultCenter,
  latLons,
  updateMarkers,
  updateShapes,
  updateVehicles,
} from "../../src/components/map"
import { LoadedShapesByRouteId } from "../../src/models/shape"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import { Vehicle } from "../../src/realtime"
import { ByRouteId, RouteId, Shape } from "../../src/schedule"
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

const mockDispatch = () => ({})

describe("map", () => {
  test("renders", () => {
    const tree = renderer
      .create(<Map vehicles={[vehicle]} centerOnVehicle={vehicle.id} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe("updateVehicles", () => {
  test("updates lat/lng values for map & markers", () => {
    document.body.innerHTML = "<div id='map'></div>"
    const map = Leaflet.map("map", {})
    const markers = {
      [vehicle.id]: {
        icon: Leaflet.marker([43, -72]).addTo(map),
        label: Leaflet.marker([43, -72]).addTo(map),
      },
    }
    updateVehicles(
      { vehicles: [vehicle], centerOnVehicle: vehicle.id },
      { map, markers, shapes: {}, zoom: null },
      {
        vehicleLabel: undefined,
        ladderVehicleLabel: VehicleLabelSetting.RunNumber,
        shuttleVehicleLabel: VehicleLabelSetting.RunNumber,
      }
    )
    expect(map.getCenter()).toEqual({ lat: 42, lng: -71 })
    expect(markers[vehicle.id].icon.getLatLng()).toEqual({ lat: 42, lng: -71 })
    expect(markers[vehicle.id].label.getLatLng()).toEqual({ lat: 42, lng: -71 })
  })

  test("exits gracefully if vehicle marker isn't in state", () => {
    document.body.innerHTML = "<div id='map'></div>"
    const map = Leaflet.map("map", {})
    const markers = {}
    expect(() => {
      updateVehicles(
        { vehicles: [vehicle], centerOnVehicle: vehicle.id },
        { map, markers, shapes: {}, zoom: null },
        {
          vehicleLabel: undefined,
          ladderVehicleLabel: VehicleLabelSetting.RunNumber,
          shuttleVehicleLabel: VehicleLabelSetting.RunNumber,
        }
      )
    }).not.toThrowError()
  })
})

describe("updateMarkers", () => {
  test("adds a new marker set for a vehicle if it doesn't exist", () => {
    document.body.innerHTML = "<div id='map'></div>"
    const map = Leaflet.map("map", {})
    const vehicles = {
      [vehicle.id]: vehicle,
    }

    const icons = updateMarkers(vehicles, {}, map, mockDispatch)

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

    const icons = updateMarkers({}, existingVehicles, map, mockDispatch)
    expect(icons[vehicle.id]).toBeUndefined()
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
      map,
      mockDispatch
    )

    expect(icons[vehicle.id]).toEqual({ label, icon })
  })
})

describe("updateShapes", () => {
  test("adds a new list of shapes for a route if it doesn't exist", () => {
    document.body.innerHTML = "<div id='map'></div>"
    const map = Leaflet.map("map", { preferCanvas: true })
    const shape: Shape = {
      id: "shape1",
      points: [
        {
          lat: 10.0,
          lon: 20.0,
        },
      ],
    }
    const shapesByRouteId: LoadedShapesByRouteId = {
      "1": [shape],
    }
    const selectedShuttleRouteIds: RouteId[] = ["1"]
    const shapes = updateShapes(
      shapesByRouteId,
      {},
      selectedShuttleRouteIds,
      map
    )
    expect(Object.keys(shapes)).toEqual(["1"])
  })

  test("removes icon if it is not in the list of current vehicles", () => {
    document.body.innerHTML = "<div id='map'></div>"
    const map = Leaflet.map("map", { preferCanvas: true })

    const shape: Shape = {
      id: "shape1",
      points: [
        {
          lat: 10.0,
          lon: 20.0,
        },
      ],
    }
    const existingShapes: ByRouteId<Leaflet.Polyline[]> = {
      "1": [Leaflet.polyline(latLons(shape), {}).addTo(map)],
    }

    const shapesByRouteId: LoadedShapesByRouteId = {}
    const selectedShuttleRouteIds: RouteId[] = []

    const shapes = updateShapes(
      shapesByRouteId,
      existingShapes,
      selectedShuttleRouteIds,
      map
    )

    expect(shapes["1"]).toBeUndefined()
  })

  test("keeps existing shapes", () => {
    document.body.innerHTML = "<div id='map'></div>"
    const map = Leaflet.map("map", { preferCanvas: true })

    const shape: Shape = {
      id: "shape1",
      points: [
        {
          lat: 10.0,
          lon: 20.0,
        },
      ],
    }
    const shapesByRouteId: LoadedShapesByRouteId = {
      "1": [shape],
    }
    const selectedShuttleRouteIds: RouteId[] = ["1"]

    const polyline = Leaflet.polyline(latLons(shape), {}).addTo(map)

    const shapes = updateShapes(
      shapesByRouteId,
      { "1": [polyline] },
      selectedShuttleRouteIds,
      map
    )

    expect(Object.keys(shapes).includes("1")).toBeTruthy()
    expect(shapes["1"].length).toEqual(1)
    expect(shapes["1"][0].getLatLngs()).toEqual([{ lat: 10, lng: 20 }])
  })
})

describe("defaultCenter", () => {
  test("has a value if centerOnVehicle is null", () => {
    expect(defaultCenter({ vehicles: [], centerOnVehicle: null })).toEqual([
      42.360718,
      -71.05891,
    ])
  })
})

describe("latLons", () => {
  test("retuns lat-lon pairs in arrays from the points of a Shape", () => {
    const shape: Shape = {
      id: "shape1",
      points: [
        { lat: 42.41356, lon: -70.99211 },
        { lat: 43.41356, lon: -71.99211 },
        { lat: 44.41356, lon: -72.99211 },
      ],
    }

    const expectedResult = [
      [42.41356, -70.99211],
      [43.41356, -71.99211],
      [44.41356, -72.99211],
    ]

    expect(latLons(shape)).toEqual(expectedResult)
  })
})
