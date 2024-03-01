import { jest, describe, test, expect, afterAll } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
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

describe("MapZoomLevel.Provider", () => {
  test.todo("Passes context through multiple providers")
  test.todo("Updates context when zoom level changes")
})

describe("MapZoomLevel.Consumer", () => {
  test.todo("Passes zoom level to child")
  test.todo("Updates when zoom level changes")
  test.todo("Throws error if used outside of a `MapZoomLevel.Provider`")
})

describe("useMapZoomLevel", () => {
  test.todo("Returns current zoom level")
  test.todo("Updates when map zoom level changes")
  test.todo("Throws error if used outside of a `MapZoomLevel.Provider`")
})

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
