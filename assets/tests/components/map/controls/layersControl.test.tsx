import { jest, describe, test, expect } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"
import React, { ReactNode } from "react"
import { MapContainer } from "react-leaflet"
import {
  LayersButtonProps,
  LayersControlState,
  LayersControl as LayersControlWithoutState,
} from "../../../../src/components/map/controls/layersControl"
import userEvent from "@testing-library/user-event"
import {
  layersControlButton,
  pullbacksSwitch,
} from "../../../testHelpers/selectors/components/map"

jest.mock("userTestGroups", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}))

const mapWrapper = ({ children }: { children: ReactNode }) => (
  <MapContainer center={[0, 0]} zoom={0}>
    {children}
  </MapContainer>
)

const LayersControl = (
  props: Omit<
    LayersButtonProps,
    "showLayersList" | "onChangeLayersListVisibility"
  > &
    Partial<
      Pick<LayersButtonProps, "showLayersList" | "onChangeLayersListVisibility">
    >
) => (
  <LayersControlState>
    {(open, setOpen) => (
      <LayersControlWithoutState
        showLayersList={open}
        onChangeLayersListVisibility={setOpen}
        {...props}
      />
    )}
  </LayersControlState>
)

describe("LayersControl", () => {
  test("when the control button is clicked, the list of layers is rendered with the selected layer marked as selected", async () => {
    render(<LayersControl tileType="base" onChangeTileType={jest.fn()} />, {
      wrapper: mapWrapper,
    })
    await userEvent.click(layersControlButton.get())

    expect(screen.getByLabelText("Map (default)")).toBeChecked()
    expect(screen.getByLabelText("Satellite")).not.toBeChecked()
  })

  test("when the a tile option is clicked, then setTileType is called", async () => {
    const setTileTypeMock = jest.fn()
    render(
      <LayersControl tileType="base" onChangeTileType={setTileTypeMock} />,
      {
        wrapper: mapWrapper,
      }
    )
    await userEvent.click(layersControlButton.get())
    await userEvent.click(screen.getByLabelText("Satellite"))

    expect(setTileTypeMock).toHaveBeenCalledWith("satellite")
  })

  test("when the control button is clicked while the layer options are open, then the layer options are closed", async () => {
    const setTileTypeMock = jest.fn()
    render(
      <LayersControl tileType="base" onChangeTileType={setTileTypeMock} />,
      {
        wrapper: mapWrapper,
      }
    )
    await userEvent.click(layersControlButton.get())
    expect(screen.getByLabelText("Map (default)")).toBeVisible()

    await userEvent.click(layersControlButton.get())

    expect(screen.queryByLabelText("Map (default)")).not.toBeVisible()
  })

  test("when the map button is clicked while the layer options are opened, then the layer options are closed", async () => {
    jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())

    const { container } = render(
      <LayersControl tileType="base" onChangeTileType={jest.fn()} />,
      {
        wrapper: mapWrapper,
      }
    )

    await userEvent.click(layersControlButton.get())
    expect(screen.getByLabelText("Map (default)")).toBeVisible()

    await userEvent.click(container.querySelector(".leaflet-container")!)

    expect(screen.queryByLabelText("Map (default)")).not.toBeVisible()
  })

  test("pull-back layer control is shown when props are provided", async () => {
    render(
      <LayersControl
        tileType="base"
        onChangeTileType={jest.fn()}
        pullbackLayerEnabled={false}
        onTogglePullbackLayer={jest.fn()}
      />,
      {
        wrapper: mapWrapper,
      }
    )
    await userEvent.click(layersControlButton.get())

    expect(pullbacksSwitch.get()).toBeInTheDocument()
  })

  test("clicking pull-back layer control toggles pull-back layer", async () => {
    const mockToggle = jest.fn()

    render(
      <LayersControl
        tileType="base"
        onChangeTileType={jest.fn()}
        pullbackLayerEnabled={false}
        onTogglePullbackLayer={mockToggle}
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
    const mockToggle = jest.fn()

    render(
      <LayersControl
        tileType="base"
        onChangeTileType={jest.fn()}
        pullbackLayerEnabled={false}
        onTogglePullbackLayer={mockToggle}
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
    render(
      <LayersControl
        tileType="base"
        onChangeTileType={jest.fn()}
        pullbackLayerEnabled={true}
        onTogglePullbackLayer={jest.fn()}
      />,
      {
        wrapper: mapWrapper,
      }
    )

    expect(screen.getByText("1")).toBeVisible()
  })

  test("when pull-back layer is disabled, doesn't show pill", async () => {
    render(
      <LayersControl
        tileType="base"
        onChangeTileType={jest.fn()}
        pullbackLayerEnabled={false}
        onTogglePullbackLayer={jest.fn()}
      />,
      {
        wrapper: mapWrapper,
      }
    )

    expect(screen.queryByText("1")).not.toBeVisible()
  })
})
