import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import { MapContainer } from "react-leaflet"
import ZoomLevelWrapper from "../../src/components/ZoomLevelWrapper"

const originalScrollTo = global.scrollTo
// Clicking/moving map calls scrollTo under the hood
jest.spyOn(global, "scrollTo").mockImplementation(jest.fn())

afterAll(() => {
  global.scrollTo = originalScrollTo
})

const renderProps = (zoomLevel: number) => <p>{zoomLevel}</p>

const getMapZoomInButton = () => {
  return screen.getByRole("button", { name: "Zoom in" })
}

describe("ZoomLevelWrapper", () => {
  test("Passes zoom level to child", () => {
    renderInMap(<ZoomLevelWrapper render={renderProps} />, { zoom: 13 })
    expect(screen.getByText("13")).toBeInTheDocument()
  })

  test("Updates when zoom level changes", async () => {
    renderInMap(<ZoomLevelWrapper render={renderProps} />, { zoom: 13 })
    expect(screen.getByText("13")).toBeInTheDocument()
    await userEvent.click(getMapZoomInButton())
    expect(screen.getByText("14")).toBeInTheDocument()
  })
})

const renderInMap = (component: JSX.Element, options?: { zoom?: number }) =>
  render(
    <MapContainer
      center={[0, 0]}
      zoom={options?.zoom || 13}
      zoomControl={true}
      maxBounds={[
        [41.2, -72],
        [43, -69.8],
      ]}
    >
      {component}
    </MapContainer>
  )
