import { jest, describe, test, expect, beforeEach } from "@jest/globals"
import { fireEvent, render, screen } from "@testing-library/react"
import React, { ComponentProps } from "react"
import { DetourMap } from "../../../src/components/detours/detourMap"
import "@testing-library/jest-dom/jest-globals"
import { defaultCenter } from "../../../src/components/map"
import { latLngLiteralFactory } from "../../factories/latLngLiteralFactory"
import { routeSegmentsFactory } from "../../factories/finishedDetourFactory"

beforeEach(() => {
  jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
})

const DetourMapWithDefaults = (
  props: Partial<ComponentProps<typeof DetourMap>>
) => (
  <DetourMap
    originalShape={[]}
    detourShape={[]}
    startPoint={undefined}
    endPoint={undefined}
    waypoints={[]}
    undoDisabled={false}
    originalShapeClickable={true}
    onClickMap={() => {}}
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
    const shapePoint = { lat: 0, lon: 0 }
    const { container } = render(
      <DetourMapWithDefaults
        originalShape={[shapePoint]}
        onClickOriginalShape={onClickOriginalShape}
      />
    )

    fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    expect(onClickOriginalShape).toHaveBeenNthCalledWith(1, shapePoint)
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

  test("when map is clicked, fires `onClickMap`", async () => {
    const onClickMap = jest.fn()
    const { container } = render(
      <DetourMapWithDefaults onClickMap={onClickMap} />
    )

    fireEvent.click(container.querySelector(".c-vehicle-map")!)

    expect(onClickMap).toHaveBeenNthCalledWith(1, {
      lat: expect.closeTo(defaultCenter.lat),
      lon: expect.closeTo(defaultCenter.lng),
    })
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

  test("when `originalShapeClickable` is true, there should be two route shape elements", () => {
    const { container } = render(
      <DetourMapWithDefaults originalShapeClickable={true} />
    )

    expect(
      container.querySelector(".c-detour_map--original-route-shape-core")
    ).toBeInTheDocument()
    expect(
      container.querySelector(".c-detour_map--original-route-shape")
    ).toBeInTheDocument()
  })

  test("when `originalShapeClickable` is false, there should be only be one (non-clickable) route shape element", () => {
    const { container } = render(
      <DetourMapWithDefaults originalShapeClickable={false} />
    )

    expect(
      container.querySelector(".c-detour_map--original-route-shape-core")
    ).toBeInTheDocument()
    expect(
      container.querySelector(".c-detour_map--original-route-shape")
    ).not.toBeInTheDocument()
  })

  test("when `routeSegments` are present, there should be two core original route shapes and one diverted route shape", () => {
    const { container } = render(
      <DetourMapWithDefaults
        originalShapeClickable={false}
        routeSegments={routeSegmentsFactory.build()}
      />
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
})
