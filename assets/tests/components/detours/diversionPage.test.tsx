import { jest, describe, test, expect, beforeEach } from "@jest/globals"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import React, { ComponentProps } from "react"
import "@testing-library/jest-dom/jest-globals"
import { fetchDetourDirections, fetchDetourMissedStops } from "../../../src/api"
import { DiversionPage as DiversionPageDefault } from "../../../src/components/detours/diversionPage"
import shapeFactory from "../../factories/shape"
import { latLngLiteralFactory } from "../../factories/latLngLiteralFactory"
import stopFactory from "../../factories/stop"
import { instantPromise } from "../../testHelpers/mockHelpers"

const DiversionPage = (
  props: Partial<ComponentProps<typeof DiversionPageDefault>>
) => {
  const { originalRoute, ...otherProps } = props
  return (
    <DiversionPageDefault
      originalRoute={{
        routeName: "66",
        routeDescription: "Harvard via Allston",
        routeOrigin: "from Andrew Station",
        routeDirection: "Outbound",
        routePatternId: "66-6-0",
        shape: shapeFactory.build(),
        center: latLngLiteralFactory.build(),
        zoom: 16,
        ...originalRoute,
      }}
      {...otherProps}
    />
  )
}

beforeEach(() => {
  jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
})

jest.mock("../../../src/api")

beforeEach(() => {
  jest.mocked(fetchDetourDirections).mockResolvedValue(null)
  jest.mocked(fetchDetourMissedStops).mockResolvedValue(null)
})

describe("DiversionPage", () => {
  test("can click on route shape to start detour", async () => {
    const { container } = render(<DiversionPage />)

    await fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    expect(screen.getByTitle("Detour Start")).not.toBeNull()
    expect(screen.queryByTitle("Detour End")).toBeNull()
  })

  test("can click on route shape again to end detour", async () => {
    const { container } = render(<DiversionPage />)

    await fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    await fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    expect(screen.getByTitle("Detour End")).not.toBeNull()
  })

  test("clicking on map while drawing a detour adds a point", async () => {
    const { container } = render(<DiversionPage />)

    await fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    await fireEvent.click(container.querySelector(".c-vehicle-map")!)

    expect(
      container.querySelectorAll(".c-detour_map-circle-marker--detour-point")
    ).toHaveLength(1)
  })

  test("detour points are correctly rendered when detour is complete", async () => {
    const { container } = render(<DiversionPage />)

    await fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    await fireEvent.click(container.querySelector(".c-vehicle-map")!)

    await fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    expect(
      container.querySelectorAll(".c-detour_map-circle-marker--detour-point")
    ).toHaveLength(1)
  })

  test("clicking on 'Undo' removes last point from detour", async () => {
    const { container } = render(<DiversionPage />)

    await fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    await fireEvent.click(container.querySelector(".c-vehicle-map")!)

    await fireEvent.click(screen.getByRole("button", { name: "Undo" }))

    expect(
      container.querySelectorAll(".c-detour_map-circle-marker--detour-point")
    ).toHaveLength(0)
  })

  test("'Undo' and 'Clear' are disabled before detour drawing is started", () => {
    render(<DiversionPage />)

    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled()
  })

  test("clicking on 'Undo' removes the start point when there are no waypoints", async () => {
    const { container } = render(<DiversionPage />)

    await fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    await fireEvent.click(screen.getByRole("button", { name: "Undo" }))

    expect(screen.queryByTitle("Detour Start")).toBeNull()
  })

  test("clicking on 'Undo' removes the end point when the detour is finished", async () => {
    const { container } = render(<DiversionPage />)

    await fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    await fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    await fireEvent.click(screen.getByRole("button", { name: "Undo" }))

    expect(screen.getByTitle("Detour Start")).not.toBeNull()
    expect(screen.queryByTitle("Detour End")).toBeNull()
  })

  test("clicking on 'Clear' removes the entire detour", async () => {
    const { container } = render(<DiversionPage />)

    await fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    await fireEvent.click(container.querySelector(".c-vehicle-map")!)

    await fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    await fireEvent.click(screen.getByRole("button", { name: "Clear" }))

    expect(
      container.querySelectorAll(".c-detour_map-circle-marker--detour-point")
    ).toHaveLength(0)

    expect(screen.queryByTitle("Detour Start")).toBeNull()
    expect(screen.queryByTitle("Detour End")).toBeNull()
  })

  test("missed stops are filled in when detour is complete", async () => {
    const stop = stopFactory.build()
    jest.mocked(fetchDetourMissedStops).mockReturnValue(instantPromise([stop]))

    const { container } = render(<DiversionPage />)

    await fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    await fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    await waitFor(() => expect(screen.getByText(stop.name)).toBeInTheDocument())
  })

  test("duplicate missed stops are only rendered once", async () => {
    const stop = stopFactory.build()
    jest
      .mocked(fetchDetourMissedStops)
      .mockReturnValue(instantPromise([stop, stop]))

    const { container } = render(<DiversionPage />)

    await fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    await fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    await waitFor(() => expect(screen.getAllByText(stop.name)).toHaveLength(1))
  })
})
