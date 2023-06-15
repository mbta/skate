import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import React, { ReactNode } from "react"
import { MapContainer } from "react-leaflet"
import { ReactMarker } from "../../../../src/components/map/utilities/reactMarker"
import { localGeoCoordinateFactory } from "../../../factories/geoCoordinate"
import { PointTuple } from "leaflet"

const mapWrapper = ({ children }: { children: ReactNode }) => (
  <MapContainer center={[0, 0]} zoom={0}>
    {children}
  </MapContainer>
)

describe("ReactMarker", () => {
  test("should render icon onto the map", () => {
    const { latitude, longitude } = localGeoCoordinateFactory.build()
    const opts = {}
    render(
      <ReactMarker
        position={[latitude, longitude]}
        divIconSettings={opts}
        icon={<div data-testid="hello!" />}
      />,
      { wrapper: mapWrapper }
    )
    expect(screen.getByTestId("hello!")).toBeVisible()
  })

  test("when icon changes, should render react changes onto map", () => {
    const { latitude, longitude } = localGeoCoordinateFactory.build()
    const testId = "test-id"
    const newContent = "hello!"

    const { rerender } = render(
      <ReactMarker
        position={[latitude, longitude]}
        icon={<div data-testid={testId} />}
      />,
      { wrapper: mapWrapper }
    )
    const icon = screen.getByTestId(testId)

    expect(icon).toBeEmptyDOMElement()

    rerender(
      <ReactMarker
        position={[latitude, longitude]}
        icon={<div data-testid={testId}>{newContent}</div>}
      />
    )

    expect(icon).toHaveTextContent(newContent)
  })

  test("when divIconSettings change, should update leaflet marker on map", () => {
    const testId = "test-id"

    const { latitude, longitude } = localGeoCoordinateFactory.build()

    const initialIconSize: PointTuple = [20, 20]
    const [initialSizeX, initialSizeY] = initialIconSize

    const newIconSize: PointTuple = [40, 50]
    const [newSizeX, newSizeY] = newIconSize

    const { rerender } = render(
      <ReactMarker
        position={[latitude, longitude]}
        divIconSettings={{ iconSize: initialIconSize }}
        icon={<div data-testid={testId} />}
      />,
      { wrapper: mapWrapper }
    )

    const icon = screen.getByTestId(testId)

    expect(icon).toBeEmptyDOMElement()

    expect(icon.parentElement?.parentElement).toHaveStyle({
      width: `${initialSizeX}px`,
      height: `${initialSizeY}px`,
    })

    rerender(
      <ReactMarker
        position={[latitude, longitude]}
        divIconSettings={{ iconSize: newIconSize }}
        icon={<div data-testid={testId} />}
      />
    )

    expect(icon.parentElement?.parentElement).toHaveStyle({
      width: `${newSizeX}px`,
      height: `${newSizeY}px`,
    })
  })
})
