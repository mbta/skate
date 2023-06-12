import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import React, { ReactNode } from "react"
import { MapContainer } from "react-leaflet"
import { ReactMarker } from "../../../../src/components/map/utilities/reactMarker"
import { localGeoCoordinateFactory } from "../../../factories/geoCoordinate"
import { DivIconOptions } from "../../../../src/components/map/utilities/reactDivIcon"

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

  test("when icon changes, should render changes onto map", () => {
    const opts = {}
    const { latitude, longitude } = localGeoCoordinateFactory.build()
    const testId = "test-id"
    const newContent = "hello!"

    const { rerender } = render(
      <ReactMarker
        position={[latitude, longitude]}
        divIconSettings={opts}
        icon={<div data-testid={testId} />}
      />,
      { wrapper: mapWrapper }
    )
    const icon = screen.getByTestId(testId)

    expect(icon).toBeEmptyDOMElement()

    rerender(
      <ReactMarker
        position={[latitude, longitude]}
        divIconSettings={opts}
        icon={<div data-testid={testId}>{newContent}</div>}
      />
    )

    expect(icon).toHaveTextContent(newContent)
  })

  test("when divIconSettings change, should render changes onto map", () => {
    const opts: DivIconOptions = { iconSize: [20, 20] }
    const { latitude, longitude } = localGeoCoordinateFactory.build()
    const testId = "test-id"

    const { rerender } = render(
      <ReactMarker
        position={[latitude, longitude]}
        divIconSettings={opts}
        icon={<div data-testid={testId} />}
      />,
      { wrapper: mapWrapper }
    )

    const icon = screen.getByTestId(testId)

    expect(icon).toBeEmptyDOMElement()

    expect(icon.parentElement?.parentElement).toHaveStyle({
      width: "20px",
      height: "20px",
    })

    rerender(
      <ReactMarker
        position={[latitude, longitude]}
        divIconSettings={{ iconSize: [40, 50] }}
        icon={<div data-testid={testId} />}
      />
    )

    expect(icon.parentElement?.parentElement).toHaveStyle({
      width: "40px",
      height: "50px",
    })
  })
})
