import { jest, describe, test, expect } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"
import React, { ReactNode } from "react"
import { MapContainer } from "react-leaflet"
import { LayersControl } from "../../../../src/components/map/controls/layersControl"
import userEvent from "@testing-library/user-event"
import {
  layersControlButton,
  pullbacksSwitch,
} from "../../../testHelpers/selectors/components/map"
import getTestGroups from "../../../../src/userTestGroups"

jest.mock("userTestGroups", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}))

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

  test("pull-back layer control not shown when user is not in test group", async () => {
    ;(getTestGroups as jest.Mock).mockReturnValue([])

    render(<LayersControl tileType="base" setTileType={jest.fn()} />, {
      wrapper: mapWrapper,
    })
    await userEvent.click(layersControlButton.get())

    expect(pullbacksSwitch.query()).not.toBeInTheDocument()
  })

  test("pull-back layer control is shown when user is in test group", async () => {
    ;(getTestGroups as jest.Mock).mockReturnValue(["pull-back-map-layer"])

    render(
      <LayersControl
        tileType="base"
        setTileType={jest.fn()}
        pullbackLayerEnabled={false}
        togglePullbackLayerEnabled={jest.fn()}
      />,
      {
        wrapper: mapWrapper,
      }
    )
    await userEvent.click(layersControlButton.get())

    expect(pullbacksSwitch.get()).toBeInTheDocument()
  })

  test("clicking pull-back layer control toggles pull-back layer", async () => {
    ;(getTestGroups as jest.Mock).mockReturnValue(["pull-back-map-layer"])

    const mockToggle = jest.fn()

    render(
      <LayersControl
        tileType="base"
        setTileType={jest.fn()}
        pullbackLayerEnabled={false}
        togglePullbackLayerEnabled={mockToggle}
      />,
      {
        wrapper: mapWrapper,
      }
    )
    await userEvent.click(layersControlButton.get())
    await userEvent.click(pullbacksSwitch.get())

    expect(mockToggle).toHaveBeenCalledTimes(1)
  })

  test("enter key toggles pull-back layer", async () => {
    ;(getTestGroups as jest.Mock).mockReturnValue(["pull-back-map-layer"])

    const mockToggle = jest.fn()

    render(
      <LayersControl
        tileType="base"
        setTileType={jest.fn()}
        pullbackLayerEnabled={false}
        togglePullbackLayerEnabled={mockToggle}
      />,
      {
        wrapper: mapWrapper,
      }
    )
    await userEvent.click(layersControlButton.get())
    pullbacksSwitch.get().focus()
    await userEvent.keyboard("{Enter}")

    expect(mockToggle).toHaveBeenCalledTimes(1)
  })

  test("when pull-back layer is enabled, shows pill", async () => {
    ;(getTestGroups as jest.Mock).mockReturnValue(["pull-back-map-layer"])

    render(
      <LayersControl
        tileType="base"
        setTileType={jest.fn()}
        pullbackLayerEnabled={true}
        togglePullbackLayerEnabled={jest.fn()}
      />,
      {
        wrapper: mapWrapper,
      }
    )

    expect(screen.getByText("1")).toBeInTheDocument()
  })
})
