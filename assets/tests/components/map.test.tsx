import Leaflet from "leaflet"
import React from "react"
import renderer from "react-test-renderer"
import Map, {
  defaultCenter,
  latLons,
  PolylinesByShapeId,
  recenterMap,
  strokeOptions,
  updateMarkers,
  updateShapes,
} from "../../src/components/map"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import { Vehicle } from "../../src/realtime"
import { Shape, Stop } from "../../src/schedule"
import { defaultSettings } from "../../src/settings"
import { State } from "../../src/state"

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

describe("map", () => {
  test("renders", () => {
    const tree = renderer
      .create(<Map vehicles={[vehicle]} centerOnVehicle={vehicle.id} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe("updateMarkers", () => {
  const appState: State = {
    selectedVehicleId: undefined,
    settings: defaultSettings,
  } as State
  const mockDispatch = () => ({})

  test("adds a new marker set for a vehicle if it doesn't exist", () => {
    document.body.innerHTML = "<div id='map'></div>"
    const map = Leaflet.map("map", {})
    const vehicles = {
      [vehicle.id]: vehicle,
    }

    const icons = updateMarkers(vehicles, {}, map, appState, mockDispatch)

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

    const icons = updateMarkers(
      {},
      existingVehicles,
      map,
      appState,
      mockDispatch
    )
    expect(icons[vehicle.id]).toBeUndefined()
  })

  test("updates existing icons", () => {
    document.body.innerHTML = "<div id='map'></div>"
    const map = Leaflet.map("map", {})
    const previousLatLng: [number, number] = [0, 0]
    const icon = Leaflet.marker(previousLatLng).addTo(map)
    const label = Leaflet.marker(previousLatLng).addTo(map)

    expect(icon.getLatLng()).toEqual({ lat: 0, lng: 0 })

    const icons = updateMarkers(
      { [vehicle.id]: vehicle },
      { [vehicle.id]: { icon, label } },
      map,
      appState,
      mockDispatch
    )

    expect(icons[vehicle.id]).toEqual({ label, icon })
    expect(icon.getLatLng()).toEqual({
      lat: vehicle.latitude,
      lng: vehicle.longitude,
    })
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

    const shapes = updateShapes([shape], {}, map)

    expect(Object.keys(shapes)).toEqual(["shape1"])
  })

  test("includes stops if they exist", () => {
    document.body.innerHTML = "<div id='map'></div>"
    const map = Leaflet.map("map", { preferCanvas: true })
    const stop: Stop = {
      id: "stop1",
      name: "stop1",
      lat: 30.0,
      lon: 40.0,
    }
    const shape: Shape = {
      id: "shape1",
      points: [
        {
          lat: 10.0,
          lon: 20.0,
        },
      ],
      stops: [stop],
    }

    const shapes = updateShapes([shape], {}, map)

    expect(shapes.shape1.stopCicles).toBeDefined()
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
    const existingShapes: PolylinesByShapeId = {
      shape1: {
        routeLine: Leaflet.polyline(latLons(shape), {}).addTo(map),
      },
    }

    const shapes = updateShapes([], existingShapes, map)

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
    const polyline = Leaflet.polyline(latLons(shape), {}).addTo(map)

    const shapes = updateShapes(
      [shape],
      { shape1: { routeLine: polyline } },
      map
    )

    expect(Object.keys(shapes).includes("shape1")).toBeTruthy()
    expect(shapes.shape1.routeLine.getLatLngs()).toEqual([{ lat: 10, lng: 20 }])
  })
})

describe("recenterMap", () => {
  test("centers the map on centerOnVehicle", () => {
    document.body.innerHTML = "<div id='map'></div>"
    const map = Leaflet.map("map", { center: defaultCenter, zoom: 16 })
    recenterMap(map, vehicle.id, { [vehicle.id]: vehicle })
    expect(map.getCenter()).toEqual({ lat: 42, lng: -71 })
  })

  test("does not center the map if centerOnVehicle is undefined", () => {
    document.body.innerHTML = "<div id='map'></div>"
    const map = Leaflet.map("map", { center: defaultCenter, zoom: 16 })
    recenterMap(map, undefined, { [vehicle.id]: vehicle })
    expect(map.getCenter()).toEqual({
      lat: defaultCenter[0],
      lng: defaultCenter[1],
    })
  })

  test("does not center the if centerOnVehicle is not found", () => {
    document.body.innerHTML = "<div id='map'></div>"
    const map = Leaflet.map("map", { center: defaultCenter, zoom: 16 })
    recenterMap(map, vehicle.id, {})
    expect(map.getCenter()).toEqual({
      lat: defaultCenter[0],
      lng: defaultCenter[1],
    })
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

describe("strokeOptions", () => {
  test("uses the color for a subway line, defaults to a thinner, opaque line", () => {
    const subwayShape = {
      color: "#DA291C",
    } as Shape

    const expected = {
      color: "#DA291C",
      opacity: 1.0,
      weight: 3,
    }

    expect(strokeOptions(subwayShape)).toEqual(expected)
  })

  test("sets default color, width, and opacity settincgs for shuttle route lines", () => {
    const shuttleShape = {
      color: undefined,
    } as Shape

    const expected = {
      color: "#4db6ac",
      opacity: 0.6,
      weight: 6,
    }

    expect(strokeOptions(shuttleShape)).toEqual(expected)
  })
})
