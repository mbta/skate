import "@testing-library/jest-dom"
import { Shape } from "../../src/schedule"
import {
  GarageMarkers,
  RouteShape,
  RouteStopMarkers,
  StationMarker,
  shapeStrokeOptions,
  TrainVehicleMarker,
  VehicleMarker,
  StopMarker,
} from "../../src/components/mapMarkers"
import stopFactory from "../factories/stop"
import vehicleFactory from "../factories/vehicle"
import { render, screen } from "@testing-library/react"
import React from "react"
import { MapContainer } from "react-leaflet"
import userEvent from "@testing-library/user-event"
import { LocationType } from "../../src/models/stopData"
import useDeviceSupportsHover from "../../src/hooks/useDeviceSupportsHover"

const originalScrollTo = global.scrollTo
// Clicking/moving map calls scrollTo under the hood
jest.spyOn(global, "scrollTo").mockImplementation(jest.fn())

afterAll(() => {
  global.scrollTo = originalScrollTo
})

const stop = stopFactory.build()
const station = stopFactory.build({ locationType: LocationType.Station })

describe("VehicleMarker", () => {
  test("Includes icon and label", () => {
    const { container } = renderInMap(
      <VehicleMarker
        vehicle={vehicleFactory.build({
          runId: "101",
        })}
        isPrimary={true}
      />
    )
    expect(container.querySelector(".m-vehicle-map__icon")).toBeInTheDocument()
    expect(screen.getByText("101")).toBeInTheDocument()
  })
})

describe("TrainVehicleMarker", () => {
  test("Includes icon and label", () => {
    const { container } = renderInMap(
      <TrainVehicleMarker trainVehicle={vehicleFactory.build()} />
    )
    expect(
      container.querySelector(".m-vehicle-map__train-icon")
    ).toBeInTheDocument()
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

    expect(shapeStrokeOptions(subwayShape)).toEqual(expected)
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

    expect(shapeStrokeOptions(shuttleShape)).toEqual(expected)
  })
})

describe("StopMarker", () => {
  test("Stop name displayed on hover when not including stop card", async () => {
    const { container } = renderInMap(
      <StopMarker stop={stop} includeStopCard={false} />
    )
    await userEvent.hover(container.querySelector(".m-vehicle-map__stop")!)
    expect(screen.getByText(stop.name)).toBeVisible()
  })

  test("Stop name displayed on click when hover not supported", async () => {
    ;(useDeviceSupportsHover as jest.Mock).mockReturnValue(false)

    const { container } = renderInMap(
      <StopMarker
        stop={stopFactory.build({ lat: 42.360718, lon: -71.05891 })}
        includeStopCard={false}
      />
    )
    await userEvent.click(container.querySelector(".m-vehicle-map__stop")!)
    expect(screen.getByText(stop.name)).toBeVisible()
  })

  test("Stop card displayed on click when includeStopCard is true", async () => {
    const originalFS = window.FS
    window.FS = { event: jest.fn(), identify: jest.fn() }
    afterEach(() => {
      window.FS = originalFS
    })

    const { container } = renderInMap(
      <StopMarker stop={stop} direction={0} includeStopCard={true} />
    )
    await userEvent.click(container.querySelector(".m-vehicle-map__stop")!)
    expect(screen.getByText("Outbound")).toBeInTheDocument()
    expect(window.FS!.event).toHaveBeenCalledWith("Bus stop card opened")
  })
})

describe("StationMarker", () => {
  test("Station icon with name on hover", async () => {
    ;(useDeviceSupportsHover as jest.Mock).mockReturnValueOnce(true)

    const originalFS = window.FS
    window.FS = { event: jest.fn(), identify: jest.fn() }
    afterEach(() => {
      window.FS = originalFS
    })

    const { container } = renderInMap(
      <StationMarker station={station} zoomLevel={13} />
    )
    expect(container.querySelector(".m-station-icon")).toBeInTheDocument()

    await userEvent.hover(container.querySelector(".m-station-icon")!)

    expect(screen.getByText(station.name)).toBeVisible()
    expect(window.FS!.event).toHaveBeenCalledWith("Station tooltip shown")
  })

  test("Station icon with name on click when hover not supported", async () => {
    ;(useDeviceSupportsHover as jest.Mock).mockReturnValueOnce(false)
    const originalFS = window.FS
    window.FS = { event: jest.fn(), identify: jest.fn() }
    afterEach(() => {
      window.FS = originalFS
    })

    const { container } = renderInMap(
      <StationMarker station={station} zoomLevel={13} />
    )
    expect(container.querySelector(".m-station-icon")).toBeInTheDocument()
    await userEvent.click(container.querySelector(".m-station-icon")!)
    expect(screen.getByText(station.name)).toBeVisible()
    expect(window.FS!.event).toHaveBeenCalledWith("Station tooltip shown")
  })
})

describe("RouteStopMarkers", () => {
  test("Returns station and stop markers", () => {
    const { container } = renderInMap(
      <RouteStopMarkers stops={[stop, station]} zoomLevel={13} />
    )

    expect(container.querySelectorAll(".m-station-icon")).toHaveLength(1)
    expect(container.querySelectorAll(".m-vehicle-map__stop")).toHaveLength(1)
  })

  test("Deduplicates list by stop id", () => {
    const { container } = renderInMap(
      <RouteStopMarkers stops={[stop, stop]} zoomLevel={13} />
    )

    expect(container.querySelectorAll(".m-vehicle-map__stop")).toHaveLength(1)
  })
})

describe("RouteShape", () => {
  test("shape is rendered", () => {
    const { container } = renderInMap(
      <RouteShape shape={{ id: "shape1", points: [{ lat: 0, lon: 0 }] }} />
    )
    expect(
      container.querySelector(".m-vehicle-map__route-shape")
    ).toBeInTheDocument()
  })
})

describe("GarageMarkers", () => {
  test("Includes all garages", () => {
    const { container } = renderInMap(<GarageMarkers zoomLevel={16} />)
    expect(container.querySelectorAll(".m-garage-icon")).toHaveLength(9)
  })
  test("Includes labels when zoom >= 16", () => {
    renderInMap(<GarageMarkers zoomLevel={16} />)
    expect(screen.getByText("Albany")).toBeInTheDocument()
  })
})

const renderInMap = (component: JSX.Element, options?: { zoom?: number }) =>
  render(
    <MapContainer
      center={[0, 0]}
      zoom={options?.zoom || 13}
      maxBounds={[
        [41.2, -72],
        [43, -69.8],
      ]}
    >
      {component}
    </MapContainer>
  )
