import "@testing-library/jest-dom"
import {
  GarageMarkers,
  RouteShape,
  RouteStopMarkers,
  StationMarker,
  TrainVehicleMarker,
  VehicleMarker,
} from "../../src/components/mapMarkers"
import stopFactory from "../factories/stop"
import vehicleFactory from "../factories/vehicle"
import trainVehicleFactory from "../factories/trainVehicle"
import { render, screen } from "@testing-library/react"
import React from "react"
import { MapContainer } from "react-leaflet"
import userEvent from "@testing-library/user-event"
import { LocationType } from "../../src/models/stopData"
import useDeviceSupportsHover from "../../src/hooks/useDeviceSupportsHover"
import { mockFullStoryEvent } from "../testHelpers/mockHelpers"
import { StopMarkerWithInfo } from "../../src/components/map/markers/stopMarker"

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
    expect(container.querySelector(".c-vehicle-map__icon")).toBeInTheDocument()
    expect(screen.getByText("101")).toBeInTheDocument()
  })
})

describe("TrainVehicleMarker", () => {
  test("Includes icon and label", () => {
    const { container } = renderInMap(
      <TrainVehicleMarker trainVehicle={trainVehicleFactory.build()} />
    )
    expect(
      container.querySelector(".c-vehicle-map__train-icon")
    ).toBeInTheDocument()
  })
})

describe("StopMarkerWithInfo", () => {
  test("Stop name displayed on hover when not including stop card", async () => {
    const { container } = renderInMap(
      <StopMarkerWithInfo stop={stop} includeStopCard={false} />
    )
    await userEvent.hover(container.querySelector(".c-vehicle-map__stop")!)
    expect(screen.getByText(stop.name)).toBeVisible()
  })

  test("Stop name displayed on click when hover not supported", async () => {
    ;(useDeviceSupportsHover as jest.Mock).mockReturnValue(false)

    const { container } = renderInMap(
      <StopMarkerWithInfo stop={stop} includeStopCard={false} />
    )
    await userEvent.click(container.querySelector(".c-vehicle-map__stop")!)
    expect(screen.getByText(stop.name)).toBeVisible()
  })

  test("Stop card displayed on click when includeStopCard is true", async () => {
    mockFullStoryEvent()

    const { container } = renderInMap(
      <StopMarkerWithInfo stop={stop} direction={0} includeStopCard={true} />
    )
    await userEvent.click(container.querySelector(".c-vehicle-map__stop")!)
    expect(screen.getByText("Outbound")).toBeInTheDocument()
    expect(window.FS!.event).toHaveBeenCalledWith("Bus stop card opened")
  })
})

describe("StationMarker", () => {
  test("Station icon with name on hover", async () => {
    ;(useDeviceSupportsHover as jest.Mock).mockReturnValueOnce(true)

    mockFullStoryEvent()

    const { container } = renderInMap(
      <StationMarker station={station} zoomLevel={13} />
    )
    expect(container.querySelector(".c-station-icon")).toBeInTheDocument()

    await userEvent.hover(container.querySelector(".c-station-icon")!)

    expect(screen.getByText(station.name)).toBeVisible()
    expect(window.FS!.event).toHaveBeenCalledWith("Station tooltip shown")
  })

  test("Station icon with name on click when hover not supported", async () => {
    mockFullStoryEvent()
    ;(useDeviceSupportsHover as jest.Mock).mockReturnValueOnce(false)

    const { container } = renderInMap(
      <StationMarker station={station} zoomLevel={13} />
    )
    expect(container.querySelector(".c-station-icon")).toBeInTheDocument()
    await userEvent.click(container.querySelector(".c-station-icon")!)
    expect(screen.getByText(station.name)).toBeVisible()
    expect(window.FS!.event).toHaveBeenCalledWith("Station tooltip shown")
  })
})

describe("RouteStopMarkers", () => {
  test("Returns station and stop markers", () => {
    const { container } = renderInMap(
      <RouteStopMarkers stops={[stop, station]} zoomLevel={13} />
    )

    expect(container.querySelectorAll(".c-station-icon")).toHaveLength(1)
    expect(container.querySelectorAll(".c-vehicle-map__stop")).toHaveLength(1)
  })

  test("Deduplicates list by stop id", () => {
    const { container } = renderInMap(
      <RouteStopMarkers stops={[stop, stop]} zoomLevel={13} />
    )

    expect(container.querySelectorAll(".c-vehicle-map__stop")).toHaveLength(1)
  })
})

describe("RouteShape", () => {
  test("shape is rendered", () => {
    const { container } = renderInMap(
      <RouteShape shape={{ id: "shape1", points: [{ lat: 0, lon: 0 }] }} />
    )
    expect(
      container.querySelector(".c-vehicle-map__route-shape")
    ).toBeInTheDocument()
  })

  test("has selected class when isSelected is true", () => {
    const { container } = renderInMap(
      <RouteShape
        shape={{ id: "shape1", points: [{ lat: 0, lon: 0 }] }}
        isSelected={true}
      />
    )
    expect(container.querySelector(".c-vehicle-map__route-shape")).toHaveClass(
      "c-vehicle-map__route-shape--selected"
    )
  })

  test("passes additional class names defined on the shape", () => {
    const { container } = renderInMap(
      <RouteShape
        shape={{
          id: "shape1",
          points: [{ lat: 0, lon: 0 }],
          className: "route-shape--red",
        }}
      />
    )
    expect(container.querySelector(".c-vehicle-map__route-shape")).toHaveClass(
      "route-shape--red"
    )
  })

  test("onClick called on click", async () => {
    const mockOnClick = jest.fn()
    const { container } = renderInMap(
      <RouteShape
        shape={{ id: "shape1", points: [{ lat: 0, lon: 0 }] }}
        onClick={mockOnClick}
      />
    )
    await userEvent.click(
      container.querySelector(".c-vehicle-map__route-shape")!
    )
    expect(mockOnClick).toHaveBeenCalled()
  })
})

describe("GarageMarkers", () => {
  test("Includes all garages", () => {
    const { container } = renderInMap(<GarageMarkers zoomLevel={16} />)
    expect(container.querySelectorAll(".c-garage-icon")).toHaveLength(9)
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
