import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import { MapContainer } from "react-leaflet"
import ZoomLevelWrapper from "../../src/components/ZoomLevelWrapper"
import { zoomInButton } from "../testHelpers/selectors/components/map"

const originalScrollTo = global.scrollTo
// Clicking/moving map calls scrollTo under the hood
jest.spyOn(global, "scrollTo").mockImplementation(jest.fn())

afterAll(() => {
  global.scrollTo = originalScrollTo
})

const renderProps = (zoomLevel: number) => <p>{zoomLevel}</p>

describe("ZoomLevelWrapper", () => {
  test("Passes zoom level to child", () => {
    renderInMap(<ZoomLevelWrapper>{renderProps}</ZoomLevelWrapper>, {
      zoom: 13,
    })
    expect(screen.getByText("13")).toBeInTheDocument()
  })

  test("Updates when zoom level changes", async () => {
    renderInMap(<ZoomLevelWrapper>{renderProps}</ZoomLevelWrapper>, {
      zoom: 13,
    })
    expect(screen.getByText("13")).toBeInTheDocument()
    await userEvent.click(zoomInButton.get())
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
