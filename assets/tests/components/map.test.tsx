import {
  jest,
  describe,
  test,
  expect,
  beforeAll,
  beforeEach,
  afterAll,
} from "@jest/globals"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"
import { LatLng } from "leaflet"
import * as Leaflet from "leaflet"
import React, { MutableRefObject } from "react"
import { act } from "@testing-library/react"
import { Map as LeafletMap } from "leaflet"
import Map, {
  defaultCenter,
  MapFollowingPrimaryVehicles,
  MapFollowingSelectionKey,
} from "../../src/components/map"
import { autoCenter } from "../../src/components/map/follower"
import { TrainVehicle, VehicleInScheduledService } from "../../src/realtime"
import vehicleFactory from "../factories/vehicle"
import stopFactory from "../factories/stop"

import userEvent from "@testing-library/user-event"
import { runIdToLabel } from "../../src/helpers/vehicleLabel"

import getTestGroups from "../../src/userTestGroups"
import { TestGroups } from "../../src/userInTestGroup"
import { LocationType } from "../../src/models/stopData"
import { setHtmlDefaultWidthHeight } from "../testHelpers/leafletMapWidth"
import { mockTileUrls } from "../testHelpers/mockHelpers"
import { streetViewModeSwitch } from "../testHelpers/selectors/components/mapPage/map"
import { streetViewUrl } from "../../src/util/streetViewUrl"
import shapeFactory from "../factories/shape"
import * as FullStory from "@fullstory/browser"

const shape = shapeFactory.build({
  id: "shape",
  points: [
    { lat: 0, lon: 0 },
    { lat: 0, lon: 0 },
  ],
  stops: [
    stopFactory.build({
      id: "stop",
      name: "stop",
      lat: 0,
      lon: 0,
    }),
  ],
})

const station = stopFactory.build({ locationType: LocationType.Station })

jest.mock("userTestGroups", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}))
jest.mock("tilesetUrls", () => ({
  __esModule: true,
  tilesetUrlForType: jest.fn(() => null),
}))

jest.mock("@fullstory/browser")

const originalScrollTo = global.scrollTo
// Clicking/moving map calls scrollTo under the hood
jest.spyOn(global, "scrollTo").mockImplementation(jest.fn())

beforeAll(() => {
  mockTileUrls()
})

beforeEach(() => {
  ;(getTestGroups as jest.Mock).mockReturnValue([])
})

afterAll(() => {
  global.scrollTo = originalScrollTo
})

describe("<MapFollowingPrimaryVehicles />", () => {
  test("draws vehicles", () => {
    const vehicle = vehicleFactory.build({})
    const result = render(<MapFollowingPrimaryVehicles vehicles={[vehicle]} />)
    expect(result.container.innerHTML).toContain("c-vehicle-map__icon")
    expect(result.container.innerHTML).toContain("c-vehicle-map__label")
  })

  test("draws secondary vehicles", () => {
    const vehicle = vehicleFactory.build({})
    const result = render(
      <MapFollowingPrimaryVehicles
        vehicles={[]}
        secondaryVehicles={[vehicle]}
      />
    )
    expect(result.container.innerHTML).toContain("c-vehicle-map__icon")
    expect(result.container.innerHTML).toContain("c-vehicle-map__label")
  })

  test("draws train vehicles", () => {
    const trainVehicle: TrainVehicle = {
      id: "red1",
      latitude: 42.24615,
      longitude: -71.00369,
      bearing: 15,
    }
    const result = render(
      <MapFollowingPrimaryVehicles
        vehicles={[]}
        trainVehicles={[trainVehicle]}
      />
    )
    expect(result.container.innerHTML).toContain("c-vehicle-map__train-icon")
  })

  test("draws shapes", () => {
    const result = render(
      <MapFollowingPrimaryVehicles vehicles={[]} shapes={[shape]} />
    )
    expect(result.container.innerHTML).toContain("c-vehicle-map__route-shape")
    expect(result.container.innerHTML).toContain("c-vehicle-map__stop")
  })

  test("doesn't draw garage icons at zoom levels < 15", async () => {
    const vehicle = vehicleFactory.build()

    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }

    const { container } = render(
      <MapFollowingPrimaryVehicles
        vehicles={[vehicle]}
        reactLeafletRef={mapRef}
      />
    )

    // Manual zoom
    act(() => {
      mapRef.current!.setZoom(14)
    })
    await animationFramePromise()
    expect(container.innerHTML).not.toContain("c-garage-icon")
    expect(screen.queryByText("Albany")).toBeNull()
  })

  test("draws garage icons only at zoom levels >= 15", async () => {
    const vehicle = vehicleFactory.build({})
    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }

    const { container } = render(
      <MapFollowingPrimaryVehicles
        vehicles={[vehicle]}
        reactLeafletRef={mapRef}
      />
    )

    // Manual zoom
    act(() => {
      mapRef.current!.setZoom(15)
    })
    await animationFramePromise()
    expect(container.innerHTML).toContain("c-garage-icon")
    expect(screen.queryByText("Albany")).toBeNull()
  })

  test("draws garage icons and labels at zoom levels >= 16", async () => {
    const vehicle = vehicleFactory.build({})
    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }

    const { container } = render(
      <MapFollowingPrimaryVehicles
        vehicles={[vehicle]}
        reactLeafletRef={mapRef}
      />
    )
    // Manual zoom
    act(() => {
      mapRef.current!.setZoom(16)
    })

    expect(container.innerHTML).toContain("c-garage-icon")
    expect(screen.getByText("Albany")).toBeInTheDocument()
  })

  test("doesn't draw station icons at zoom levels < 15", async () => {
    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }

    const { container } = render(
      <MapFollowingPrimaryVehicles
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
    expect(container.querySelector(".c-station-icon")).not.toBeInTheDocument()
    expect(screen.queryByText(station.name)).toBeNull()
  })

  test("draws station icons at zoom levels >= 15", async () => {
    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }

    const { container } = render(
      <MapFollowingPrimaryVehicles
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
    expect(container.querySelector(".c-station-icon")).toBeVisible()
    expect(screen.queryByText(station.name)).toBeNull()
  })

  test("station name appears on hover", async () => {
    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }

    const { container } = render(
      <MapFollowingPrimaryVehicles
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
    await userEvent.hover(container.querySelector(".c-station-icon")!)

    expect(screen.queryByText(station.name)).toBeInTheDocument()
  })

  test("if shape contains stations, renders them as stations instead of regular stops", async () => {
    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }

    const { container } = render(
      <MapFollowingPrimaryVehicles
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
    expect(container.querySelector(".c-station-icon")).toBeVisible()
  })

  test("performs onPrimaryVehicleSelected function when primary vehicle selected", async () => {
    const vehicle = vehicleFactory.build({})
    const onClick = jest.fn()
    render(
      <MapFollowingPrimaryVehicles
        vehicles={[vehicle]}
        onPrimaryVehicleSelect={onClick}
      />
    )
    await userEvent.click(screen.getByText(runIdToLabel(vehicle.runId!)))
    expect(onClick).toHaveBeenCalledWith(vehicle)
  })

  test("does not perform onPrimaryVehicleSelected function when secondary vehicle selected", async () => {
    const vehicle = vehicleFactory.build({})
    const onClick = jest.fn()
    render(
      <MapFollowingPrimaryVehicles
        vehicles={[]}
        secondaryVehicles={[vehicle]}
        onPrimaryVehicleSelect={onClick}
      />
    )
    await userEvent.click(screen.getByText(runIdToLabel(vehicle.runId!)))
    expect(onClick).not.toHaveBeenCalled()
  })

  test("renders street view link from stop if in maps test group", async () => {
    ;(getTestGroups as jest.Mock).mockReturnValue([TestGroups.MapBeta])

    const { container } = render(
      <MapFollowingPrimaryVehicles
        vehicles={[]}
        shapes={[shape]}
        includeStopCard={true}
      />
    )

    await userEvent.click(container.querySelector(".c-vehicle-map__stop")!)

    expect(
      screen.getByRole("link", { name: /street view/i })
    ).toBeInTheDocument()
  })

  test("does not render street view link from stop if not in maps test group", async () => {
    ;(getTestGroups as jest.Mock).mockReturnValue([])

    const { container } = render(
      <MapFollowingPrimaryVehicles vehicles={[]} shapes={[shape]} />
    )

    await userEvent.click(container.querySelector("e-map__stop")!)

    expect(
      screen.queryByRole("link", { name: /Go to Street View/ })
    ).not.toBeInTheDocument()
  })

  test("can turn on street view and click on the map", async () => {
    const mockedFS = jest.mocked(FullStory)
    const openSpy = jest
      .spyOn(window, "open")
      .mockImplementationOnce(jest.fn<typeof window.open>())
    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }

    render(
      <MapFollowingPrimaryVehicles
        vehicles={[]}
        allowStreetView={true}
        reactLeafletRef={mapRef}
      />
    )

    await userEvent.click(streetViewModeSwitch.get())
    expect(mockedFS.event).toHaveBeenNthCalledWith(
      1,
      "Dedicated street view toggled",
      { streetViewEnabled_bool: true }
    )

    await userEvent.click(mapRef.current!.getPane("mapPane")!)

    /**
     * These "magic numbers" correspond to the nearest floating point value of
     * our map's {@link defaultCenter} (and also constrained by `maxBounds`).
     */
    const latitude = 42.360700296138525
    const longitude = -71.0588836669922
    const url = streetViewUrl({ latitude, longitude })

    expect(mockedFS.event).toHaveBeenNthCalledWith(
      2,
      "User clicked map to open street view",
      {
        streetViewUrl_str: url,
        clickedMapAt: {
          latitude_real: latitude,
          longitude_real: longitude,
        },
      }
    )

    expect(openSpy).toHaveBeenCalled()

    expect(streetViewModeSwitch.get()).toBeVisible()
    expect(streetViewModeSwitch.get()).toBeChecked()
  })

  test("turning off street view also fires a FullStory event", async () => {
    const mockedFS = jest.mocked(FullStory)

    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }

    render(
      <MapFollowingPrimaryVehicles
        vehicles={[]}
        allowStreetView={true}
        reactLeafletRef={mapRef}
      />
    )

    await userEvent.click(screen.getByRole("switch", { name: /Street View/ }))

    await userEvent.click(screen.getByRole("switch", { name: /Street View/ }))

    expect(mockedFS.event).toHaveBeenCalledWith(
      "Dedicated street view toggled",
      { streetViewEnabled_bool: false }
    )

    expect(
      screen.queryByRole("switch", { name: /Street View/, checked: false })
    ).toBeInTheDocument()
  })

  test("clicking on the map with street view off doesn't open link", async () => {
    const openSpy = jest
      .spyOn(window, "open")
      .mockImplementationOnce(jest.fn<typeof window.open>())

    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }

    render(
      <MapFollowingPrimaryVehicles
        vehicles={[]}
        allowStreetView={true}
        reactLeafletRef={mapRef}
      />
    )

    await userEvent.click(mapRef.current!.getPane("mapPane")!)

    expect(openSpy).not.toHaveBeenCalled()
  })

  test("pressing escape leaves street view mode", async () => {
    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }

    render(
      <MapFollowingPrimaryVehicles
        vehicles={[]}
        allowStreetView={true}
        reactLeafletRef={mapRef}
      />
    )

    await userEvent.click(screen.getByRole("switch", { name: /Street View/ }))

    await userEvent.keyboard("{Escape}")

    expect(
      screen.queryByRole("switch", { name: /Street View/, checked: false })
    ).toBeInTheDocument()
  })

  test("does not show street view when prop is not specified", () => {
    render(<MapFollowingPrimaryVehicles vehicles={[]} />)

    expect(
      screen.queryByRole("switch", { name: /Street View/ })
    ).not.toBeInTheDocument()
  })

  test("sets selected vehicle id as selected ", () => {
    const vehicle = vehicleFactory.build()

    const { container } = render(
      <MapFollowingPrimaryVehicles
        vehicles={[vehicle]}
        selectedVehicleId={vehicle.id}
      />
    )

    expect(
      container.querySelector(".c-vehicle-map__icon .selected")
    ).toBeInTheDocument()
    expect(
      container.querySelector(".c-vehicle-map__label.selected")
    ).toBeInTheDocument()
  })
})

describe("autoCenter", () => {
  beforeEach(() => {
    setHtmlDefaultWidthHeight(0, 0)
  })
  const L = jest.requireActual<typeof Leaflet>("leaflet")
  const pickerContainerIsVisible = false

  test("centers the map on a single vehicle", () => {
    document.body.innerHTML = "<div id='map'></div>"
    const map = L.map("map")
    autoCenter(map, [[42, -71]], pickerContainerIsVisible)
    expect(map.getCenter()).toEqual({ lat: 42, lng: -71 })
  })

  test("fits around multiple vehicles", () => {
    document.body.innerHTML = "<div id='map'></div>"
    const map = L.map("map")
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
    const map = L.map("map")
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
    const location = { lat: 42.25, lng: -71 }
    const vehicle: VehicleInScheduledService = vehicleFactory.build({
      latitude: location.lat,
      longitude: location.lng,
    })
    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }
    render(
      <MapFollowingPrimaryVehicles
        vehicles={[vehicle]}
        reactLeafletRef={mapRef}
      />
    )

    await animationFramePromise()
    expect(getCenter(mapRef)).toEqual(location)
  })

  test("tracks a vehicle when it moves", async () => {
    const vehicle = vehicleFactory.build({})
    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }
    const oldLatLng = { lat: 42.25, lng: -71 }
    const oldVehicle = {
      ...vehicle,
      latitude: oldLatLng.lat,
      longitude: oldLatLng.lng,
    }
    const { rerender } = render(
      <MapFollowingPrimaryVehicles
        vehicles={[oldVehicle]}
        reactLeafletRef={mapRef}
      />
    )
    await animationFramePromise()
    const newLatLng = { lat: 42.35, lng: -71.1 }
    const newVehicle = {
      ...vehicle,
      latitude: newLatLng.lat,
      longitude: newLatLng.lng,
    }
    rerender(
      <MapFollowingPrimaryVehicles
        vehicles={[newVehicle]}
        reactLeafletRef={mapRef}
      />
    )
    await animationFramePromise()
    expect(getCenter(mapRef)).toEqual(newLatLng)
  })

  test("manual moves disable auto centering", async () => {
    const vehicle = vehicleFactory.build({})
    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }
    const { rerender, container } = render(
      <MapFollowingPrimaryVehicles
        vehicles={[vehicle]}
        reactLeafletRef={mapRef}
      />
    )
    await animationFramePromise()
    expect(container.firstChild).toHaveClass(
      "c-vehicle-map-state--auto-centering"
    )
    const manualLatLng = { lat: 42.25, lng: -70.9 }

    act(() => {
      mapRef.current!.fire("dragstart")
      mapRef.current!.panTo(manualLatLng)
    })

    await animationFramePromise()
    const newLatLng = { lat: 42.35, lng: -71.1 }
    const newVehicle = {
      ...vehicle,
      latitude: newLatLng.lat,
      longitude: newLatLng.lng,
    }
    rerender(
      <MapFollowingPrimaryVehicles
        vehicles={[newVehicle]}
        reactLeafletRef={mapRef}
      />
    )
    await animationFramePromise()
    expect(getCenter(mapRef)).toEqual(manualLatLng)
    expect(container.firstChild).not.toHaveClass(
      "c-vehicle-map-state--auto-centering"
    )
  })

  test("auto recentering does not disable auto centering", async () => {
    const vehicle = vehicleFactory.build({})
    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }
    const latLng1 = { lat: 42.1, lng: -71 }
    const latLng2 = { lat: 42.2, lng: -71.1 }
    const latLng3 = { lat: 42.3, lng: -71.2 }
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
      <MapFollowingPrimaryVehicles
        vehicles={[vehicle1]}
        reactLeafletRef={mapRef}
      />
    )
    await animationFramePromise()
    rerender(
      <MapFollowingPrimaryVehicles
        vehicles={[vehicle2]}
        reactLeafletRef={mapRef}
      />
    )

    await animationFramePromise()
    rerender(
      <MapFollowingPrimaryVehicles
        vehicles={[vehicle3]}
        reactLeafletRef={mapRef}
      />
    )

    await animationFramePromise()
    expect(getCenter(mapRef)).toEqual(latLng3)
  })

  test("recenter control turns on auto center", async () => {
    const mockedFS = jest.mocked(FullStory)
    const mapRef: MutableRefObject<LeafletMap | null> = { current: null }
    const result = render(
      <MapFollowingPrimaryVehicles vehicles={[]} reactLeafletRef={mapRef} />
    )
    await animationFramePromise()

    // Manual move to turn off auto centering
    const manualLatLng = { lat: 42.25, lng: -70.9 }
    act(() => {
      mapRef.current!.fire("dragstart")
      mapRef.current!.panTo(manualLatLng)
    })
    await animationFramePromise()
    expect(result.container.firstChild).not.toHaveClass(
      "c-vehicle-map-state--auto-centering"
    )
    expect(getCenter(mapRef)).toEqual(manualLatLng)

    // Click the recenter button
    await userEvent.click(result.getByTitle("Recenter Map"))
    await animationFramePromise()
    expect(result.container.firstChild).toHaveClass(
      "c-vehicle-map-state--auto-centering"
    )
    expect(getCenter(mapRef)).toEqual(defaultCenter)
    expect(mockedFS.event).toHaveBeenCalledWith("Recenter control clicked", {})
  })

  describe("for MapFollowingSelectionKey", () => {
    test("changing followerResetKey turns on auto center", async () => {
      const mapRef: MutableRefObject<LeafletMap | null> = { current: null }
      const vehicles: VehicleInScheduledService[] = []
      const result = render(
        <MapFollowingSelectionKey
          vehicles={vehicles}
          reactLeafletRef={mapRef}
          selectionKey="key1"
        />
      )
      await animationFramePromise()

      // Manual move to turn off auto centering
      const manualLatLng = { lat: 42.35, lng: -70.9 }
      act(() => {
        mapRef.current!.fire("dragstart")
        mapRef.current!.panTo(manualLatLng)
      })
      await animationFramePromise()

      result.rerender(
        <MapFollowingSelectionKey
          vehicles={vehicles}
          reactLeafletRef={mapRef}
          selectionKey="key2"
        />
      )
      await animationFramePromise()
      expect(result.container.firstChild).toHaveClass(
        "c-vehicle-map-state--auto-centering"
      )
      expect(getCenter(mapRef)).toEqual(defaultCenter)
    })
  })
})

describe("TileLayer", () => {
  test("when the selected layer is base, the base tiles and attribution are rendered", () => {
    const { container } = render(<Map tileType="base" vehicles={[]} />)

    expect(container.querySelector("img[src^=test_base_url")).not.toBeNull()

    expect(
      screen.getByRole("link", { name: "OpenStreetMap" })
    ).toBeInTheDocument()
  })

  test("when the selected layer is satellite, the satellite tiles and attribution are rendered", () => {
    const { container } = render(<Map tileType="satellite" vehicles={[]} />)

    expect(
      container.querySelector("img[src^=test_satellite_url")
    ).not.toBeNull()

    expect(
      screen.getByRole("link", { name: "MassGIS 2021" })
    ).toBeInTheDocument()
  })
})
