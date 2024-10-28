import { describe, test, expect } from "@jest/globals"
import { render } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"
import React, { ReactNode } from "react"
import { MapContainer, ZoomControl } from "react-leaflet"
import { CustomControl } from "../../../../src/components/map/controls/customControl"
import { FullscreenControl } from "../../../../src/components/map"

const mapWrapper = ({ children }: { children: ReactNode }) => (
  <MapContainer
    center={[0, 0]}
    zoom={0}
    attributionControl={false}
    zoomControl={false}
  >
    {children}
  </MapContainer>
)

const customControlContents = () => {
  return <button className="test-control-child-1">Click Me</button>
}

describe("CustomControls", () => {
  test("when a position is specified, puts the control in the expected corner", () => {
    const { container } = render(
      <>
        <CustomControl className="test-control" position="topright">
          {customControlContents()}
        </CustomControl>
      </>,
      {
        wrapper: mapWrapper,
      }
    )

    expect(
      container.querySelector(".leaflet-control-container")
    ).toMatchSnapshot()
  })

  test("when insertAfterSelector is specified and there is a node matching that selector, then the control is added after it", () => {
    const { container } = render(
      <>
        <ZoomControl position="topright" />

        <FullscreenControl position="topright" />
        <CustomControl
          className="test-control"
          position="topright"
          insertAfterSelector=".leaflet-control-zoom"
        >
          {customControlContents()}
        </CustomControl>
      </>,
      {
        wrapper: mapWrapper,
      }
    )

    expect(
      container.querySelector(".leaflet-control-container")
    ).toMatchSnapshot()
  })

  test("when insertAfterSelector is specified and there is not a node matching that selector, then the control is added at the end of the leaflet-container", () => {
    const { container } = render(
      <>
        <ZoomControl position="topright" />

        <FullscreenControl position="topright" />
        <CustomControl
          className="test-control"
          position="topright"
          insertAfterSelector=".non-existent-selector"
        >
          {customControlContents()}
        </CustomControl>
      </>,
      {
        wrapper: mapWrapper,
      }
    )

    expect(
      container.querySelector(".leaflet-control-container")
    ).toMatchSnapshot()
  })

  test("when insertFirst is specified, then the control is added at the beginning of the leaflet-container", () => {
    const { container } = render(
      <>
        <ZoomControl position="topright" />

        <FullscreenControl position="topright" />
        <CustomControl className="test-control" position="topright" insertFirst>
          {customControlContents()}
        </CustomControl>
      </>,
      {
        wrapper: mapWrapper,
      }
    )

    expect(
      container.querySelector(
        ".leaflet-control-container .test-control:first-child"
      )
    ).toBeInTheDocument()
  })
})
