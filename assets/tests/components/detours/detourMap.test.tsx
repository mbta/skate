import { jest, describe, test, expect, beforeEach } from "@jest/globals"
import { fireEvent, render, screen } from "@testing-library/react"
import React, { ComponentProps } from "react"
import { DetourMap } from "../../../src/components/detours/detourMap"
import "@testing-library/jest-dom/jest-globals"
import { defaultCenter } from "../../../src/components/map"
import { latLngLiteralFactory } from "../../factories/latLngLiteralFactory"
import { routeSegmentsFactory } from "../../factories/finishedDetourFactory"
import { RealDispatchWrapper } from "../../testHelpers/wrappers"
import { layersControlButton } from "../../testHelpers/selectors/components/map"
import { mockTileUrls } from "../../testHelpers/mockHelpers"
import { tilesetUrlForType } from "../../../src/tilesetUrls"
import stopFactory from "../../factories/stop"
import {
  missedStopIcon,
  stopIcon,
} from "../../testHelpers/selectors/components/map/markers/stopIcon"
import { streetViewModeSwitch } from "../../testHelpers/selectors/components/mapPage/map"

beforeEach(() => {
  jest.mocked(tilesetUrlForType).mockReturnValue(undefined)
  jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
})

jest.mock("../../../src/tilesetUrls")

const DetourMapWithDefaults = (
  props: Partial<ComponentProps<typeof DetourMap>>
) => (
  <DetourMap
    originalShape={[]}
    detourShape={[]}
    stops={[]}
    startPoint={undefined}
    endPoint={undefined}
    waypoints={[]}
    undoDisabled={false}
    onAddWaypoint={() => {}}
    onClickOriginalShape={() => {}}
    onUndo={() => {}}
    onClear={() => {}}
    center={latLngLiteralFactory.build()}
    zoom={16}
    {...props}
  />
)

describe("DetourMap", () => {
  test("when `originalShape` is clicked, fires `onClickOriginalShape`", async () => {
    const onClickOriginalShape = jest.fn()
    const { container } = render(
      <DetourMapWithDefaults onClickOriginalShape={onClickOriginalShape} />
    )

    fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    expect(onClickOriginalShape).toHaveBeenCalled()
  })

  test("`originalShape` has unstarted class before being clicked", async () => {
    const onClickOriginalShape = jest.fn()
    const shapePoint = { lat: 0, lon: 0 }
    const { container } = render(
      <DetourMapWithDefaults
        originalShape={[shapePoint]}
        onClickOriginalShape={onClickOriginalShape}
      />
    )

    expect(
      container.querySelector(
        ".c-detour_map--original-route-shape.c-detour_map--original-route-shape__unstarted"
      )!
    ).toBeInTheDocument()
  })

  test("`originalShape` no longer has unstarted class after detour is started", async () => {
    const onClickOriginalShape = jest.fn()
    const shapePoint = { lat: 0, lon: 0 }
    const { container } = render(
      <DetourMapWithDefaults
        originalShape={[shapePoint]}
        startPoint={shapePoint}
        onClickOriginalShape={onClickOriginalShape}
      />
    )

    expect(
      container.querySelector(
        ".c-detour_map--original-route-shape.c-detour_map--original-route-shape__unstarted"
      )
    ).toBeNull()
  })

  test("when `onAddWaypoint` is present, map has a waypoint cursor, given by the __clickable class", async () => {
    const { container } = render(
      <DetourMapWithDefaults onAddWaypoint={() => {}} />
    )

    expect(
      container.querySelector(".c-detour_map--map__clickable")
    ).toBeInTheDocument()
  })

  test("when `onAddWaypoint` is absent, map has a normal cursor", async () => {
    const { container } = render(
      <DetourMapWithDefaults onAddWaypoint={undefined} />
    )

    expect(
      container.querySelector(".c-detour_map--map__clickable")
    ).not.toBeInTheDocument()
  })

  test("when `onAddWaypoint` is present and street view mode is enabled, map has a normal cursor", async () => {
    const { container } = render(
      <DetourMapWithDefaults onAddWaypoint={() => {}} />
    )

    fireEvent.click(streetViewModeSwitch.get())

    expect(
      container.querySelector(".c-detour_map--map__clickable")
    ).not.toBeInTheDocument()
  })

  test("when map is clicked, fires `onAddWaypoint`", async () => {
    const onAddWaypoint = jest.fn()
    const { container } = render(
      <DetourMapWithDefaults onAddWaypoint={onAddWaypoint} />
    )

    fireEvent.click(container.querySelector(".c-vehicle-map")!)

    expect(onAddWaypoint).toHaveBeenNthCalledWith(1, {
      lat: expect.closeTo(defaultCenter.lat),
      lon: expect.closeTo(defaultCenter.lng),
    })
  })

  test("when map is clicked in street view mode, does not fire `onAddWaypoint`", async () => {
    const openSpy = jest
      .spyOn(window, "open")
      .mockImplementationOnce(jest.fn<typeof window.open>())

    const onAddWaypoint = jest.fn()
    const { container } = render(
      <DetourMapWithDefaults onAddWaypoint={onAddWaypoint} />
    )

    fireEvent.click(streetViewModeSwitch.get())

    fireEvent.click(container.querySelector(".c-vehicle-map")!)

    expect(onAddWaypoint).not.toHaveBeenCalled()
    expect(openSpy).toHaveBeenCalled()
  })

  test("clicking undo button fires `onUndo`", async () => {
    const onUndo = jest.fn()
    render(<DetourMapWithDefaults onUndo={onUndo} />)

    fireEvent.click(screen.getByRole("button", { name: "Undo" }))

    expect(onUndo).toHaveBeenCalledTimes(1)
  })

  test("clicking clear button fires `onClear`", async () => {
    const onClear = jest.fn()
    render(<DetourMapWithDefaults onClear={onClear} />)

    fireEvent.click(screen.getByRole("button", { name: "Clear" }))

    expect(onClear).toHaveBeenCalledTimes(1)
  })

  test("displays `startPoint` when provided", async () => {
    const { rerender } = render(<DetourMapWithDefaults />)

    expect(screen.queryByTitle("Detour Start")).not.toBeInTheDocument()

    rerender(<DetourMapWithDefaults startPoint={{ lat: 0, lon: 0 }} />)

    expect(screen.getByTitle("Detour Start")).toBeVisible()
  })

  test("displays `endPoint` when provided", async () => {
    const { rerender } = render(<DetourMapWithDefaults />)

    expect(screen.queryByTitle("Detour End")).not.toBeInTheDocument()

    rerender(<DetourMapWithDefaults endPoint={{ lat: 0, lon: 0 }} />)

    expect(screen.getByTitle("Detour End")).toBeVisible()
  })

  test("displays `waypoints` when provided", async () => {
    const { container, rerender } = render(<DetourMapWithDefaults />)

    expect(
      container.querySelectorAll(".c-detour_map-circle-marker--detour-point")
    ).toHaveLength(0)

    rerender(
      <DetourMapWithDefaults
        waypoints={[
          { lat: 0, lon: 0 },
          { lat: 1, lon: 1 },
          { lat: 2, lon: 2 },
        ]}
      />
    )

    expect(
      container.querySelectorAll(".c-detour_map-circle-marker--detour-point")
    ).toHaveLength(3)
  })

  test("when `undoDisabled` is true, undo button should be disabled", () => {
    const { rerender } = render(<DetourMapWithDefaults />)

    const undoButton = screen.getByRole("button", {
      name: "Undo",
    })

    expect(undoButton).not.toBeDisabled()

    rerender(<DetourMapWithDefaults undoDisabled />)

    expect(undoButton).toBeDisabled()
  })

  test("when `routeSegments` are absent, there should be two route shape elements", () => {
    const { container } = render(<DetourMapWithDefaults />)

    expect(
      container.querySelector(".c-detour_map--original-route-shape-core")
    ).toBeInTheDocument()
    expect(
      container.querySelector(".c-detour_map--original-route-shape")
    ).toBeInTheDocument()
  })

  test("when `routeSegments` are absent and street view is enabled, only the `-core` route shape should be present", () => {
    const { container } = render(<DetourMapWithDefaults />)

    fireEvent.click(streetViewModeSwitch.get())

    expect(
      container.querySelector(".c-detour_map--original-route-shape-core")
    ).toBeInTheDocument()
    expect(
      container.querySelector(".c-detour_map--original-route-shape")
    ).not.toBeInTheDocument()
  })

  test("when `routeSegments` are present, there should be two core original route shapes and one diverted route shape", () => {
    const { container } = render(
      <DetourMapWithDefaults routeSegments={routeSegmentsFactory.build()} />
    )

    expect(
      container.querySelector(".c-detour_map--original-route-shape-core")
    ).toBeInTheDocument()
    expect(
      container.querySelector(".c-detour_map--original-route-shape")
    ).not.toBeInTheDocument()
    expect(
      container.querySelector(".c-detour_map--original-route-shape-diverted")
    ).toBeInTheDocument()
  })

  test("Can change tile layer to satellite", async () => {
    mockTileUrls()

    const { container } = render(
      <RealDispatchWrapper>
        <DetourMapWithDefaults />
      </RealDispatchWrapper>
    )

    fireEvent.click(layersControlButton.get())

    fireEvent.click(screen.getByLabelText("Satellite"))

    expect(
      container.querySelector("img[src^=test_satellite_url")
    ).not.toBeNull()
  })

  test("stops are drawn on the map", () => {
    const stops = [
      { ...stopFactory.build(), missed: false },
      { ...stopFactory.build(), missed: false },
      { ...stopFactory.build(), missed: false },
    ]

    const { container } = render(<DetourMapWithDefaults stops={stops} />)

    expect(stopIcon.getAll(container)).toHaveLength(3)
  })

  test("stops are drawn as missed stop icons when they are missed", () => {
    const stops = [
      { ...stopFactory.build(), missed: true },
      { ...stopFactory.build(), missed: true },
      { ...stopFactory.build(), missed: false },
    ]

    const { container } = render(<DetourMapWithDefaults stops={stops} />)

    expect(stopIcon.getAll(container)).toHaveLength(1)
    expect(missedStopIcon.getAll(container)).toHaveLength(2)
  })

  test("duplicate stops are only drawn once", () => {
    const duplicateStop = { ...stopFactory.build(), missed: true }
    const stops = [
      duplicateStop,
      { ...stopFactory.build(), missed: true },
      duplicateStop,
      { ...stopFactory.build(), missed: false },
    ]

    const { container } = render(<DetourMapWithDefaults stops={stops} />)

    expect(stopIcon.getAll(container)).toHaveLength(1)
    expect(missedStopIcon.getAll(container)).toHaveLength(2)
  })
})
