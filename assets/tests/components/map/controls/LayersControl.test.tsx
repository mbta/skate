import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import React, { ReactNode } from "react"
import { MapContainer } from "react-leaflet"
import { LayersControl } from "../../../../src/components/map/controls/LayersControl"
import userEvent from "@testing-library/user-event"
import { mockTileUrls } from "../../../testHelpers/mockHelpers"

jest.mock("../../../../src/tilesetUrls", () => ({
  __esModule: true,
  tilesetUrlForType: jest.fn(() => null),
}))

const mapWrapper = ({ children }: { children: ReactNode }) => (
  <MapContainer center={[0, 0]} zoom={0}>
    {children}
  </MapContainer>
)

beforeAll(() => {
  mockTileUrls()
})

describe("LayersControl", () => {
  test("when the control button is clicked, the list of layers is rendered with the selected layer marked as selected", async () => {
    render(<LayersControl tileType="base" setTileType={jest.fn} />, {
      wrapper: mapWrapper,
    })
    await userEvent.click(screen.getByRole("button", { name: "Layers" }))

    expect(screen.getByLabelText("Map (default)")).toBeChecked()
    expect(screen.getByLabelText("Satellite")).not.toBeChecked()
  })

  test("when the a tile option is clicked, then setTileType is called", async () => {
    const setTileTypeMock = jest.fn()
    render(<LayersControl tileType="base" setTileType={setTileTypeMock} />, {
      wrapper: mapWrapper,
    })
    await userEvent.click(screen.getByRole("button", { name: "Layers" }))
    await userEvent.click(screen.getByLabelText("Satellite"))

    expect(setTileTypeMock).toHaveBeenCalled()
  })
  test("when the control button is clicked while the layer options are open, then the layer options are closed", async () => {
    const setTileTypeMock = jest.fn()
    render(<LayersControl tileType="base" setTileType={setTileTypeMock} />, {
      wrapper: mapWrapper,
    })
    await userEvent.click(screen.getByRole("button", { name: "Layers" }))
    expect(screen.getByLabelText("Map (default)")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Layers" }))

    expect(screen.queryByLabelText("Map (default)")).toBeNull()
  })
  test("when the map button is clicked while the layer options are opened, then the layer options are closed", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())

    const { container } = render(
      <LayersControl tileType="base" setTileType={jest.fn} />,
      {
        wrapper: mapWrapper,
      }
    )

    await userEvent.click(screen.getByRole("button", { name: "Layers" }))
    expect(screen.getByLabelText("Map (default)")).toBeInTheDocument()

    await userEvent.click(container.querySelector(".leaflet-container")!)

    expect(screen.queryByLabelText("Map (default)")).toBeNull()
  })

  test("when the selected layer is base, the base tiles are rendered", () => {
    const { container } = render(
      <LayersControl tileType="base" setTileType={jest.fn} />,
      {
        wrapper: mapWrapper,
      }
    )

    expect(container.querySelector("img[src^=test_base_url")).not.toBeNull()
  })

  test("when the selected layer is satellite, the satellite tiles are rendered", () => {
    const { container } = render(
      <LayersControl tileType="satellite" setTileType={jest.fn} />,
      {
        wrapper: mapWrapper,
      }
    )

    expect(
      container.querySelector("img[src^=test_satellite_url")
    ).not.toBeNull()
  })
})
