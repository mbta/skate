import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { LatLng } from "leaflet"
import React, { MutableRefObject } from "react"
import { act } from "@testing-library/react"
import { Map as LeafletMap } from "leaflet"
import Map, { autoCenter, defaultCenter } from "../../src/components/map"
import { TrainVehicle, Vehicle } from "../../src/realtime"
import vehicleFactory from "../factories/vehicle"
import stopFactory from "../factories/stop"

import userEvent from "@testing-library/user-event"
import { runIdToLabel } from "../../src/helpers/vehicleLabel"

import getTestGroups from "../../src/userTestGroups"
import { MAP_BETA_GROUP_NAME } from "../../src/userInTestGroup"
import { LocationType } from "../../src/models/stopData"

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

const station = stopFactory.build({ locationType: LocationType.Station })

jest.mock("userTestGroups", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}))

const originalScrollTo = global.scrollTo
// Clicking/moving map calls scrollTo under the hood
jest.spyOn(global, "scrollTo").mockImplementation(jest.fn())

beforeEach(() => {
  ;(getTestGroups as jest.Mock).mockReturnValue([])
})

afterAll(() => {
  global.scrollTo = originalScrollTo
})

describe("<Map />", () => {
  test("draws vehicles", () => {
    const vehicle = vehicleFactory.build({})
    const result = render(<Map vehicles={[vehicle]} />)
    expect(result.container.innerHTML).toContain("m-vehicle-map__icon")
    expect(result.container.innerHTML).toContain("m-vehicle-map__label")
  })

  test("draws secondary vehicles", () => {
    const vehicle = vehicleFactory.build({})
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
    const vehicle = vehicleFactory.build()
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
    const vehicle = vehicleFactory.build({})
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
    const vehicle = vehicleFactory.build({})
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
    const vehicle = vehicleFactory.build({})
    const { container } = render(<Map vehicles={[vehicle]} />)
    expect(container.innerHTML).not.toContain("m-garage-icon")
  })

  test("doesn't draw station icons at zoom levels < 15", async () => {
    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }

    const { container } = render(
      <Map
        vehicles={[vehicleFactory.build()]}
        reactLeafletRef={mapRef}
        stations={[station]}
      />
    )

    // Manual zoom
    act(() => {
      mapRef.current!.setZoom(14)
    })
    await animationFramePromise()
    expect(container.querySelector(".m-station-icon")).not.toBeInTheDocument()
    expect(screen.queryByText(station.name)).toBeNull()
  })

  test("draws station icons at zoom levels >= 15", async () => {
    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }

    const { container } = render(
      <Map
        vehicles={[vehicleFactory.build()]}
        reactLeafletRef={mapRef}
        stations={[station]}
      />
    )

    // Manual zoom
    act(() => {
      mapRef.current!.setZoom(15)
    })
    await animationFramePromise()
    expect(container.querySelector(".m-station-icon")).toBeVisible()
    expect(screen.queryByText(station.name)).toBeNull()
  })

  test("station name appears on hover", async () => {
    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }

    const { container } = render(
      <Map
        vehicles={[vehicleFactory.build()]}
        reactLeafletRef={mapRef}
        stations={[station]}
      />
    )

    // Manual zoom
    act(() => {
      mapRef.current!.setZoom(15)
    })
    await animationFramePromise()
    await userEvent.hover(container.querySelector(".m-station-icon")!)

    expect(screen.queryByText(station.name)).toBeInTheDocument()
  })

  test("if shape contains stations, renders them as stations instead of regular stops", async () => {
    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }

    const { container } = render(
      <Map
        shapes={[{ ...shape, stops: [station] }]}
        vehicles={[]}
        reactLeafletRef={mapRef}
      />
    )

    // Manual zoom
    act(() => {
      mapRef.current!.setZoom(14)
    })
    await animationFramePromise()
    expect(container.querySelector(".m-station-icon")).toBeVisible()
  })

  test("performs onPrimaryVehicleSelected function when primary vehicle selected", async () => {
    const vehicle = vehicleFactory.build({})
    const onClick = jest.fn()
    render(<Map vehicles={[vehicle]} onPrimaryVehicleSelect={onClick} />)
    await userEvent.click(screen.getByText(runIdToLabel(vehicle.runId!)))
    expect(onClick).toHaveBeenCalledWith(expect.objectContaining(vehicle))
  })

  test("does not perform onPrimaryVehicleSelected function when secondary vehicle selected", async () => {
    const vehicle = vehicleFactory.build({})
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

  test("renders street view link from stop if in maps test group", async () => {
    ;(getTestGroups as jest.Mock).mockReturnValue([MAP_BETA_GROUP_NAME])

    const { container } = render(
      <Map vehicles={[]} shapes={[shape]} includeStopCard={true} />
    )

    await userEvent.click(container.querySelector(".m-vehicle-map__stop")!)

    expect(
      screen.getByRole("link", { name: /street view/i })
    ).toBeInTheDocument()
  })

  test("does not render street view link from stop if not in maps test group", async () => {
    ;(getTestGroups as jest.Mock).mockReturnValue([])

    const { container } = render(<Map vehicles={[]} shapes={[shape]} />)

    await userEvent.click(container.querySelector("e-map__stop")!)

    expect(
      screen.queryByRole("link", { name: /Go to Street View/ })
    ).not.toBeInTheDocument()
  })

  test("can turn on street view and click on the map", async () => {
    const openSpy = jest.spyOn(window, "open").mockImplementationOnce(jest.fn())

    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }

    render(
      <Map vehicles={[]} allowStreetView={true} reactLeafletRef={mapRef} />
    )

    await userEvent.click(screen.getByRole("switch", { name: /Street View/ }))

    await userEvent.click(mapRef.current!.getPane("mapPane")!)

    expect(openSpy).toHaveBeenCalled()

    expect(
      screen.queryByRole("switch", { name: /Street View/, checked: false })
    ).toBeInTheDocument()
  })

  test("clicking on the map with street view off doesn't open link", async () => {
    const openSpy = jest.spyOn(window, "open").mockImplementationOnce(jest.fn())

    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }

    render(
      <Map vehicles={[]} allowStreetView={true} reactLeafletRef={mapRef} />
    )

    await userEvent.click(mapRef.current!.getPane("mapPane")!)

    expect(openSpy).not.toHaveBeenCalled()
  })

  test("pressing escape leaves street view mode", async () => {
    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }

    render(
      <Map vehicles={[]} allowStreetView={true} reactLeafletRef={mapRef} />
    )

    await userEvent.click(screen.getByRole("switch", { name: /Street View/ }))

    await userEvent.keyboard("{Escape}")

    expect(
      screen.queryByRole("switch", { name: /Street View/, checked: false })
    ).toBeInTheDocument()
  })

  test("does not show street view when prop is not specified", () => {
    render(<Map vehicles={[]} />)

    expect(
      screen.queryByRole("switch", { name: /Street View/ })
    ).not.toBeInTheDocument()
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
    const location = { lat: 42, lng: -71 }
    const vehicle: Vehicle = vehicleFactory.build({
      latitude: location.lat,
      longitude: location.lng,
    })
    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }
    render(<Map vehicles={[vehicle]} reactLeafletRef={mapRef} />)

    await animationFramePromise()
    expect(getCenter(mapRef)).toEqual(location)
  })

  test("tracks a vehicle when it moves", async () => {
    const vehicle = vehicleFactory.build({})
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
    const vehicle = vehicleFactory.build({})
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
    const vehicle = vehicleFactory.build({})
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
