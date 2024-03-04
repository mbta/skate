import { jest, describe, test, expect, afterAll } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import {
  GarageMarkers,
  RouteShape,
  RouteStopMarkers,
  StationMarker,
  StopMarkers,
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
import { StopMarkerWithInfo } from "../../src/components/map/markers/stopMarker"
import {
  getAllStationIcons,
  getAllStopIcons,
} from "../testHelpers/selectors/components/mapPage/map"
import { fullStoryEvent } from "../../src/helpers/fullStory"

const originalScrollTo = global.scrollTo
// Clicking/moving map calls scrollTo under the hood
jest.spyOn(global, "scrollTo").mockImplementation(jest.fn())

jest.mock("../../src/helpers/fullStory")

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
    const mockedFSEvent = jest.mocked(fullStoryEvent)

    const { container } = renderInMap(
      <StopMarkerWithInfo stop={stop} includeStopCard={true} />
    )
    await userEvent.click(container.querySelector(".c-vehicle-map__stop")!)
    expect(mockedFSEvent).toHaveBeenCalledWith("Bus stop card opened", {})
  })
})

describe("StationMarker", () => {
  test("Station icon with name on hover", async () => {
    ;(useDeviceSupportsHover as jest.Mock).mockReturnValueOnce(true)

    const mockedFSEvent = jest.mocked(fullStoryEvent)

    const { container } = renderInMap(
      <StationMarker station={station} zoomLevel={13} />
    )
    expect(container.querySelector(".c-station-icon")).toBeInTheDocument()

    await userEvent.hover(container.querySelector(".c-station-icon")!)

    expect(screen.getByText(station.name)).toBeVisible()
    expect(mockedFSEvent).toHaveBeenCalledWith("Station tooltip shown", {})
  })

  test("Station icon with name on click when hover not supported", async () => {
    const mockedFSEvent = jest.mocked(fullStoryEvent)
    ;(useDeviceSupportsHover as jest.Mock).mockReturnValueOnce(false)

    const { container } = renderInMap(
      <StationMarker station={station} zoomLevel={13} />
    )
    expect(container.querySelector(".c-station-icon")).toBeInTheDocument()
    await userEvent.click(container.querySelector(".c-station-icon")!)
    expect(screen.getByText(station.name)).toBeVisible()
    expect(mockedFSEvent).toHaveBeenCalledWith("Station tooltip shown", {})
  })
})

describe("StopMarkers", () => {
  test("When zoom = 14, renders no markers", () => {
    const { container } = renderInMap(
      <StopMarkers stops={[stop, station]} zoomLevel={14} />
    )

    expect(getAllStationIcons(container)).toHaveLength(0)
    expect(getAllStopIcons(container)).toHaveLength(0)
  })
  test("When zoom = 15, renders station markers only", () => {
    const { container } = renderInMap(
      <StopMarkers stops={[stop, station]} zoomLevel={15} />
    )

    expect(getAllStationIcons(container)).toHaveLength(1)
    expect(getAllStopIcons(container)).toHaveLength(0)
  })

  test("When zoom = 17, renders station and stop markers", () => {
    const { container } = renderInMap(
      <StopMarkers stops={[stop, station]} zoomLevel={17} />
    )

    expect(getAllStationIcons(container)).toHaveLength(1)
    expect(getAllStopIcons(container)).toHaveLength(1)
  })

  test("When a stop has the same location as a station, renders the station", () => {
    const { container } = renderInMap(
      <StopMarkers
        stops={[
          stop,
          stopFactory.build({
            lat: stop.lat,
            lon: stop.lon,
            locationType: LocationType.Station,
          }),
        ]}
        zoomLevel={17}
      />
    )

    expect(getAllStationIcons(container)).toHaveLength(1)
    expect(getAllStopIcons(container)).toHaveLength(0)
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

  test("When a stop has the same location as a station, renders the station", () => {
    const { container } = renderInMap(
      <RouteStopMarkers
        stops={[
          stop,
          stopFactory.build({
            lat: stop.lat,
            lon: stop.lon,
            locationType: LocationType.Station,
          }),
        ]}
        zoomLevel={13}
      />
    )

    expect(getAllStationIcons(container)).toHaveLength(1)
    expect(getAllStopIcons(container)).toHaveLength(0)
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
