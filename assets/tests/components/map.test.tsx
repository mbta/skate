import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { LatLng } from "leaflet"
import React, { MutableRefObject } from "react"
import { act } from "@testing-library/react"
import { Map as LeafletMap } from "leaflet"
import Map, {
  autoCenter,
  defaultCenter,
  strokeOptions,
} from "../../src/components/map"
import { TrainVehicle, Vehicle } from "../../src/realtime"
import { Shape } from "../../src/schedule"
import vehicleFactory from "../factories/vehicle"
import userEvent from "@testing-library/user-event"
import { runIdToLabel } from "../../src/helpers/vehicleLabel"

import getTestGroups from "../../src/userTestGroups"
import { MAP_BETA_GROUP_NAME } from "../../src/userInTestGroup"

const vehicle: Vehicle = vehicleFactory.build({
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
  operatorFirstName: "PATTI",
  operatorLastName: "SMITH",
  operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
  bearing: 33,
  blockId: "block-1",
  previousVehicleId: "v2",
  scheduleAdherenceSecs: 0,
  isShuttle: false,
  isOverload: false,
  isOffCourse: false,
  isRevenue: true,
  layoverDepartureTime: null,
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
    stopId: "s1",
    stopName: "Stop Name",
  },
  timepointStatus: {
    fractionUntilTimepoint: 0.5,
    timepointId: "tp1",
  },
  scheduledLocation: null,
  routeStatus: "on_route",
  endOfTripType: "another_trip",
  blockWaivers: [],
  crowding: null,
})

const shape = {
  id: "shape",
  points: [
    { lat: 0, lon: 0 },
    { lat: 0, lon: 0 },
  ],
  stops: [
    {
      id: "stop",
      name: "stop",
      lat: 0,
      lon: 0,
    },
  ],
}

jest.mock("userTestGroups", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}))

beforeEach(() => {
  ;(getTestGroups as jest.Mock).mockReturnValue([])
})

describe("map", () => {
  test("draws vehicles", () => {
    const result = render(<Map vehicles={[vehicle]} />)
    expect(result.container.innerHTML).toContain("m-vehicle-map__icon")
    expect(result.container.innerHTML).toContain("m-vehicle-map__label")
  })

  test("draws secondary vehicles", () => {
    const result = render(<Map vehicles={[]} secondaryVehicles={[vehicle]} />)
    expect(result.container.innerHTML).toContain("m-vehicle-map__icon")
    expect(result.container.innerHTML).toContain("m-vehicle-map__label")
  })

  test("draws train vehicles", () => {
    const trainVehicle: TrainVehicle = {
      id: "red1",
      latitude: 42.24615,
      longitude: -71.00369,
      bearing: 15,
    }
    const result = render(<Map vehicles={[]} trainVehicles={[trainVehicle]} />)
    expect(result.container.innerHTML).toContain("m-vehicle-map__train-icon")
  })

  test("draws shapes", () => {
    const result = render(<Map vehicles={[]} shapes={[shape]} />)
    expect(result.container.innerHTML).toContain("m-vehicle-map__route-shape")
    expect(result.container.innerHTML).toContain("m-vehicle-map__stop")
  })

  test("doesn't draw garage icons at zoom levels < 15", async () => {
    ;(getTestGroups as jest.Mock).mockReturnValue([MAP_BETA_GROUP_NAME])

    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }

    const { container } = render(
      <Map vehicles={[vehicle]} reactLeafletRef={mapRef} />
    )

    // Manual zoom
    act(() => {
      mapRef.current!.setZoom(14)
    })
    await animationFramePromise()
    expect(container.innerHTML).not.toContain("m-garage-icon")
    expect(screen.queryByText("Albany")).toBeNull()
  })

  test("draws garage icons only at zoom levels >= 15", async () => {
    ;(getTestGroups as jest.Mock).mockReturnValue([MAP_BETA_GROUP_NAME])

    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }

    const { container } = render(
      <Map vehicles={[vehicle]} reactLeafletRef={mapRef} />
    )

    // Manual zoom
    act(() => {
      mapRef.current!.setZoom(15)
    })
    await animationFramePromise()
    expect(container.innerHTML).toContain("m-garage-icon")
    expect(screen.queryByText("Albany")).toBeNull()
  })

  test("draws garage icons and labels at zoom levels >= 16", async () => {
    ;(getTestGroups as jest.Mock).mockReturnValue([MAP_BETA_GROUP_NAME])

    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }

    const { container } = render(
      <Map vehicles={[vehicle]} reactLeafletRef={mapRef} />
    )
    // Manual zoom
    act(() => {
      mapRef.current!.setZoom(16)
    })

    expect(container.innerHTML).toContain("m-garage-icon")
    expect(screen.getByText("Albany")).toBeInTheDocument()
  })

  test("no garage icons if not in test group", () => {
    const { container } = render(<Map vehicles={[vehicle]} />)
    expect(container.innerHTML).not.toContain("m-garage-icon")
  })

  test("performs onPrimaryVehicleSelected function when primary vehicle selected", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())

    const onClick = jest.fn()
    render(<Map vehicles={[vehicle]} onPrimaryVehicleSelect={onClick} />)
    await userEvent.click(screen.getByText(runIdToLabel(vehicle.runId!)))
    expect(onClick).toHaveBeenCalledWith(expect.objectContaining(vehicle))
  })

  test("does not perform onPrimaryVehicleSelected function when secondary vehicle selected", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
    const onClick = jest.fn()
    render(
      <Map
        vehicles={[]}
        secondaryVehicles={[vehicle]}
        onPrimaryVehicleSelect={onClick}
      />
    )
    await userEvent.click(screen.getByText(runIdToLabel(vehicle.runId!)))
    expect(onClick).not.toHaveBeenCalled()
  })

  test("renders street view link if in maps test group", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
    ;(getTestGroups as jest.Mock).mockReturnValue([MAP_BETA_GROUP_NAME])

    const { container } = render(<Map vehicles={[]} shapes={[shape]} />)

    const stopButton = container.querySelector(".m-vehicle-map__stop")
    if (!stopButton) {
      throw new Error("<Map> missing route stop node")
    }

    await userEvent.click(stopButton)

    expect(
      screen.getByRole("button", { name: /Go to Street View/ })
    ).toBeInTheDocument()
  })
})

describe("autoCenter", () => {
  const Leaflet = jest.requireActual("leaflet")
  const pickerContainerIsVisible = false

  test("centers the map on a single vehicle", () => {
    document.body.innerHTML = "<div id='map'></div>"
    const map = Leaflet.map("map")
    autoCenter(map, [[42, -71]], pickerContainerIsVisible)
    expect(map.getCenter()).toEqual({ lat: 42, lng: -71 })
  })

  test("fits around multiple vehicles", () => {
    document.body.innerHTML = "<div id='map'></div>"
    const map = Leaflet.map("map")
    autoCenter(
      map,
      [
        [42.0, -71],
        [42.5, -71],
      ],
      pickerContainerIsVisible
    )
    expect(map.getCenter().lat).toBeCloseTo(42.25, 3)
  })

  test("does not center the map if there are no vehicles", () => {
    document.body.innerHTML = "<div id='map'></div>"
    const map = Leaflet.map("map")
    autoCenter(map, [], pickerContainerIsVisible)
    expect(map.getCenter()).toEqual(defaultCenter)
  })
})

const getCenter = (
  LeafletMapRef: MutableRefObject<LeafletMap | null>
): LatLng | null => LeafletMapRef.current && LeafletMapRef.current.getCenter()

const animationFramePromise = (): Promise<null> => {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve(null))
  })
}

describe("auto centering", () => {
  test("auto centers on a vehicle", async () => {
    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }
    render(<Map vehicles={[vehicle]} reactLeafletRef={mapRef} />)
    await animationFramePromise()
    expect(getCenter(mapRef)).toEqual({ lat: 42, lng: -71 })
  })

  test("tracks a vehicle when it moves", async () => {
    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }
    const oldLatLng = { lat: 42, lng: -71 }
    const oldVehicle = {
      ...vehicle,
      latitude: oldLatLng.lat,
      longitude: oldLatLng.lng,
    }
    const { rerender } = render(
      <Map vehicles={[oldVehicle]} reactLeafletRef={mapRef} />
    )
    await animationFramePromise()
    const newLatLng = { lat: 42.1, lng: -71.1 }
    const newVehicle = {
      ...vehicle,
      latitude: newLatLng.lat,
      longitude: newLatLng.lng,
    }
    rerender(<Map vehicles={[newVehicle]} reactLeafletRef={mapRef} />)
    await animationFramePromise()
    expect(getCenter(mapRef)).toEqual(newLatLng)
  })

  test("manual moves disable auto centering", async () => {
    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }
    const { rerender, container } = render(
      <Map vehicles={[vehicle]} reactLeafletRef={mapRef} />
    )
    await animationFramePromise()
    expect(container.firstChild).toHaveClass(
      "m-vehicle-map-state--auto-centering"
    )
    const manualLatLng = { lat: 41.9, lng: -70.9 }

    act(() => {
      mapRef.current!.fire("dragstart")
      mapRef.current!.panTo(manualLatLng)
    })

    await animationFramePromise()
    const newLatLng = { lat: 42.1, lng: -71.1 }
    const newVehicle = {
      ...vehicle,
      latitude: newLatLng.lat,
      longitude: newLatLng.lng,
    }
    rerender(<Map vehicles={[newVehicle]} reactLeafletRef={mapRef} />)
    await animationFramePromise()
    expect(getCenter(mapRef)).toEqual(manualLatLng)
    expect(container.firstChild).not.toHaveClass(
      "m-vehicle-map-state--auto-centering"
    )
  })

  test("auto recentering does not disable auto centering", async () => {
    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }
    const latLng1 = { lat: 42, lng: -71 }
    const latLng2 = { lat: 42.1, lng: -71.1 }
    const latLng3 = { lat: 42.2, lng: -71.2 }
    const vehicle1 = {
      ...vehicle,
      latitude: latLng1.lat,
      longitude: latLng1.lng,
    }
    const vehicle2 = {
      ...vehicle,
      latitude: latLng2.lat,
      longitude: latLng2.lng,
    }
    const vehicle3 = {
      ...vehicle,
      latitude: latLng3.lat,
      longitude: latLng3.lng,
    }
    const { rerender } = render(
      <Map vehicles={[vehicle1]} reactLeafletRef={mapRef} />
    )
    await animationFramePromise()
    rerender(<Map vehicles={[vehicle2]} reactLeafletRef={mapRef} />)

    await animationFramePromise()
    rerender(<Map vehicles={[vehicle3]} reactLeafletRef={mapRef} />)

    await animationFramePromise()
    expect(getCenter(mapRef)).toEqual(latLng3)
  })

  test("recenter control turns on auto center", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }
    const result = render(<Map vehicles={[]} reactLeafletRef={mapRef} />)
    await animationFramePromise()

    // Manual move to turn off auto centering
    const manualLatLng = { lat: 41.9, lng: -70.9 }
    act(() => {
      mapRef.current!.fire("dragstart")
      mapRef.current!.panTo(manualLatLng)
    })
    await animationFramePromise()
    expect(result.container.firstChild).not.toHaveClass(
      "m-vehicle-map-state--auto-centering"
    )
    expect(getCenter(mapRef)).toEqual(manualLatLng)

    // Click the recenter button
    await userEvent.click(result.getByTitle("Recenter Map"))
    await animationFramePromise()
    expect(result.container.firstChild).toHaveClass(
      "m-vehicle-map-state--auto-centering"
    )
    expect(getCenter(mapRef)).toEqual(defaultCenter)
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
      weight: 4,
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
