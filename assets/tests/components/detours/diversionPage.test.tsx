import { jest, describe, test, expect, beforeEach } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import React, { ComponentProps } from "react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom/jest-globals"
import { fetchDetourDirections } from "../../../src/api"
import { DiversionPage as DiversionPageDefault } from "../../../src/components/detours/diversionPage"
import shapeFactory from "../../factories/shape"

const DiversionPage = (
  props: Partial<ComponentProps<typeof DiversionPageDefault>>
) => (
  <DiversionPageDefault
    routeName="66"
    routeDescription="Harvard via Allston"
    routeOrigin="from Andrew Station"
    routeDirection="Outbound"
    shape={shapeFactory.build()}
    {...props}
  />
)

beforeEach(() => {
  jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
})

jest.mock("../../../src/api")

beforeEach(() => {
  jest.mocked(fetchDetourDirections).mockResolvedValue(null)
})

describe("DetourMap", () => {
  test("can click on route shape to start detour", async () => {
    const { container } = render(<DiversionPage />)

    await userEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    expect(screen.getByTitle("Detour Start")).not.toBeNull()
    expect(screen.queryByTitle("Detour End")).toBeNull()
  })

  test("can click on route shape again to end detour", async () => {
    const { container } = render(<DiversionPage />)

    await userEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    await userEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    expect(screen.getByTitle("Detour End")).not.toBeNull()
  })

  test("clicking on map while drawing a detour adds a point", async () => {
    const { container } = render(<DiversionPage />)

    await userEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    await userEvent.click(container.querySelector(".c-vehicle-map")!)

    expect(
      container.querySelectorAll(".c-detour_map-circle-marker--detour-point")
    ).toHaveLength(1)
  })

  test("detour points are correctly rendered when detour is complete", async () => {
    const { container } = render(<DiversionPage />)

    await userEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    await userEvent.click(container.querySelector(".c-vehicle-map")!)

    await userEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    expect(
      container.querySelectorAll(".c-detour_map-circle-marker--detour-point")
    ).toHaveLength(1)
  })

  test("clicking on 'Clear Last Waypoint' removes last point from detour", async () => {
    const { container } = render(<DiversionPage />)

    await userEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    await userEvent.click(container.querySelector(".c-vehicle-map")!)

    await userEvent.click(
      screen.getByRole("button", { name: "Clear Last Waypoint" })
    )

    expect(
      container.querySelectorAll(".c-detour_map-circle-marker--detour-point")
    ).toHaveLength(0)
  })

  test("'Clear Last Waypoint' is disabled before detour drawing is started", () => {
    render(<DiversionPage />)

    expect(
      screen.getByRole("button", { name: "Clear Last Waypoint" })
    ).toBeDisabled()
  })

  test("'Clear Last Waypoint' is disabled when detour drawing has started but no waypoints are present", async () => {
    const { container } = render(<DiversionPage />)

    await userEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    expect(
      screen.getByRole("button", { name: "Clear Last Waypoint" })
    ).toBeDisabled()
  })

  test("'Clear Last Waypoint' is disabled when detour drawing has finished", async () => {
    const { container } = render(<DiversionPage />)

    await userEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    await userEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    expect(
      screen.getByRole("button", { name: "Clear Last Waypoint" })
    ).toBeDisabled()
  })
})
