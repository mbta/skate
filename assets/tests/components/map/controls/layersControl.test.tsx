import { jest, describe, test, expect } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"
import React, { ReactNode } from "react"
import { MapContainer } from "react-leaflet"
import { LayersControl } from "../../../../src/components/map/controls/layersControl"
import userEvent from "@testing-library/user-event"
import { layersControlButton } from "../../../testHelpers/selectors/components/map"

const mapWrapper = ({ children }: { children: ReactNode }) => (
  <MapContainer center={[0, 0]} zoom={0}>
    {children}
  </MapContainer>
)

describe("LayersControl", () => {
  test("when the control button is clicked, the list of layers is rendered with the selected layer marked as selected", async () => {
    render(<LayersControl tileType="base" setTileType={jest.fn()} />, {
      wrapper: mapWrapper,
    })
    await userEvent.click(layersControlButton.get())

    expect(screen.getByLabelText("Map (default)")).toBeChecked()
    expect(screen.getByLabelText("Satellite")).not.toBeChecked()
  })

  test("when the a tile option is clicked, then setTileType is called", async () => {
    const setTileTypeMock = jest.fn()
    render(<LayersControl tileType="base" setTileType={setTileTypeMock} />, {
      wrapper: mapWrapper,
    })
    await userEvent.click(layersControlButton.get())
    await userEvent.click(screen.getByLabelText("Satellite"))

    expect(setTileTypeMock).toHaveBeenCalledWith("satellite")
  })
  test("when the control button is clicked while the layer options are open, then the layer options are closed", async () => {
    const setTileTypeMock = jest.fn()
    render(<LayersControl tileType="base" setTileType={setTileTypeMock} />, {
      wrapper: mapWrapper,
    })
    await userEvent.click(layersControlButton.get())
    expect(screen.getByLabelText("Map (default)")).toBeInTheDocument()

    await userEvent.click(layersControlButton.get())

    expect(screen.queryByLabelText("Map (default)")).toBeNull()
  })
  test("when the map button is clicked while the layer options are opened, then the layer options are closed", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())

    const { container } = render(
      <LayersControl tileType="base" setTileType={jest.fn()} />,
      {
        wrapper: mapWrapper,
      }
    )

    await userEvent.click(layersControlButton.get())
    expect(screen.getByLabelText("Map (default)")).toBeInTheDocument()

    await userEvent.click(container.querySelector(".leaflet-container")!)

    expect(screen.queryByLabelText("Map (default)")).toBeNull()
  })
})
