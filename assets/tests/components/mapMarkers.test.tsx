import "@testing-library/jest-dom"
import { Shape } from "../../src/schedule"
import {
  GarageMarkers,
  RouteShape,
  RouteStopMarkers,
  StationIconSize,
  StationMarker,
  strokeOptions,
  TrainVehicleMarker,
  VehicleMarker,
} from "../../src/components/mapMarkers"
import vehicleFactory from "../factories/vehicle"

import { render, screen } from "@testing-library/react"
import React from "react"
import { MapContainer } from "react-leaflet"
import userEvent from "@testing-library/user-event"
import { LocationType } from "../../src/models/stopData"

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

describe("StationMarker", () => {
  test("Station icon with name on hover", async () => {
    const { container } = renderInMap(
      <StationMarker
        station={{ id: "station-1", name: "Station 1", lat: 0, lon: 0 }}
        iconSize={StationIconSize.small}
      />
    )
    expect(container.querySelector(".m-station-icon")).toBeInTheDocument()
    await userEvent.hover(container.querySelector(".m-station-icon")!)
    expect(screen.getByText("Station 1")).toBeInTheDocument()
  })
})

describe("RouteStopMarkers", () => {
  test("Returns station and stop markers", () => {
    const { container } = renderInMap(
      <RouteStopMarkers
        stops={[
          {
            id: "1",
            name: "Stop 1",
            locationType: LocationType.Stop,
            lat: 0,
            lon: 0,
          },
          {
            id: "2",
            name: "Station 1",
            locationType: LocationType.Station,
            lat: 0,
            lon: 0,
          },
        ]}
        iconSize={StationIconSize.small}
      />
    )

    expect(container.querySelectorAll(".m-station-icon")).toHaveLength(1)
    expect(container.querySelectorAll(".m-vehicle-map__stop")).toHaveLength(1)
  })

  test("Deduplicates list by stop id", () => {
    const stop = {
      id: "1",
      name: "Stop 1",
      locationType: LocationType.Stop,
      lat: 0,
      lon: 0,
    }
    const { container } = renderInMap(
      <RouteStopMarkers stops={[stop, stop]} iconSize={StationIconSize.small} />
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
    <MapContainer center={[0, 0]} zoom={options?.zoom || 13}>
      {component}
    </MapContainer>
  )
