import { jest, describe, test, expect, beforeEach } from "@jest/globals"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import React, { ComponentProps } from "react"
import "@testing-library/jest-dom/jest-globals"
import { fetchDetourDirections, fetchDetourMissedStops } from "../../../src/api"
import { DiversionPage as DiversionPageDefault } from "../../../src/components/detours/diversionPage"
import shapeFactory from "../../factories/shape"
import { latLngLiteralFactory } from "../../factories/latLngLiteralFactory"
import stopFactory from "../../factories/stop"
import userEvent from "@testing-library/user-event"
import { finishDetourButton } from "../../testHelpers/selectors/components/detours/diversionPage"

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

    fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    expect(screen.getByTitle("Detour Start")).not.toBeNull()
    expect(screen.queryByTitle("Detour End")).toBeNull()
  })

  test("can click on route shape again to end detour", async () => {
    const { container } = render(<DiversionPage />)

    fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    expect(screen.getByTitle("Detour End")).not.toBeNull()
  })

  test("when end point has been set, finish detour button is visible", async () => {
    const { container } = render(<DiversionPage />)

    fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    expect(
      screen.getByRole("button", { name: "Finish Detour", hidden: true })
    ).not.toBeVisible()

    fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    expect(screen.getByRole("button", { name: "Finish Detour" })).toBeVisible()
  })

  test("clicking on map while drawing a detour adds a point", async () => {
    const { container } = render(<DiversionPage />)

    fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    fireEvent.click(container.querySelector(".c-vehicle-map")!)

    expect(
      container.querySelectorAll(".c-detour_map-circle-marker--detour-point")
    ).toHaveLength(1)
  })

  test("detour points are correctly rendered when detour is complete", async () => {
    const { container } = render(<DiversionPage />)

    fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    fireEvent.click(container.querySelector(".c-vehicle-map")!)

    fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    expect(
      container.querySelectorAll(".c-detour_map-circle-marker--detour-point")
    ).toHaveLength(1)
  })

  test("clicking on 'Undo' removes last point from detour", async () => {
    const { container } = render(<DiversionPage />)

    fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    fireEvent.click(container.querySelector(".c-vehicle-map")!)

    fireEvent.click(screen.getByRole("button", { name: "Undo" }))

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

    fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    fireEvent.click(screen.getByRole("button", { name: "Undo" }))

    expect(screen.queryByTitle("Detour Start")).toBeNull()
  })

  test("clicking on 'Undo' removes the end point when the detour is finished", async () => {
    const { container } = render(<DiversionPage />)

    fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    fireEvent.click(screen.getByRole("button", { name: "Undo" }))

    expect(screen.getByTitle("Detour Start")).not.toBeNull()
    expect(screen.queryByTitle("Detour End")).toBeNull()
  })

  test("clicking on 'Clear' removes the entire detour", async () => {
    const { container } = render(<DiversionPage />)

    fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    fireEvent.click(container.querySelector(".c-vehicle-map")!)

    fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    fireEvent.click(screen.getByRole("button", { name: "Clear" }))

    expect(
      container.querySelectorAll(".c-detour_map-circle-marker--detour-point")
    ).toHaveLength(0)

    expect(screen.queryByTitle("Detour Start")).toBeNull()
    expect(screen.queryByTitle("Detour End")).toBeNull()
  })

  test("missed stops are filled in when detour is complete", async () => {
    const stop1 = stopFactory.build()
    const stop2 = stopFactory.build()
    jest.mocked(fetchDetourMissedStops).mockResolvedValue([stop1, stop2])

    const { container } = render(<DiversionPage />)

    await act(async () => {
      fireEvent.click(
        container.querySelector(".c-detour_map--original-route-shape")!
      )
    })

    await act(async () => {
      fireEvent.click(
        container.querySelector(".c-detour_map--original-route-shape")!
      )
    })

    waitFor(() => {
      expect(screen.getByText(stop1.name)).toBeInTheDocument()
      expect(screen.getByText(stop2.name)).toBeInTheDocument()
      expect(screen.getByText("2")).toBeInTheDocument()
    })
  })

  test("duplicate missed stops are only rendered once", async () => {
    const stop = stopFactory.build()
    jest.mocked(fetchDetourMissedStops).mockResolvedValue([stop, stop])

    const { container } = render(<DiversionPage />)

    await act(async () => {
      fireEvent.click(
        container.querySelector(".c-detour_map--original-route-shape")!
      )
    })

    await act(async () => {
      fireEvent.click(
        container.querySelector(".c-detour_map--original-route-shape")!
      )
    })

    waitFor(() => expect(screen.getAllByText(stop.name)).toHaveLength(1))
  })

  test("When 'Finish Detour' button is clicked, shows 'Share Detour Details' screen", async () => {
    const { container } = render(<DiversionPage />)

    fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    await userEvent.click(finishDetourButton.get())

    expect(
      screen.queryByRole("heading", { name: "Create Detour" })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Share Detour Details" })
    ).toBeVisible()
  })

  test("'Share Detour Details' screen has alert describing that the detour is not editable", async () => {
    const { container } = render(<DiversionPage />)

    fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    await userEvent.click(finishDetourButton.get())

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Detour is not editable from this screen."
    )
  })

  test("'Share Detour Details' screen has back button to edit detour again", async () => {
    const { container } = render(<DiversionPage />)

    fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    await userEvent.click(finishDetourButton.get())

    expect(screen.getByRole("button", { name: "Edit Detour" })).toBeVisible()
  })

  test("'Share Detour Details' screen has button to copy details", async () => {
    const { container } = render(<DiversionPage />)

    fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    await userEvent.click(finishDetourButton.get())

    expect(screen.getByRole("button", { name: "Copy Details" })).toBeVisible()
  })

  test("'Share Detour Details' screen copies text content to clipboard when clicked copy details button", async () => {
    userEvent.setup() // Configure the clipboard API

    const { container } = render(<DiversionPage />)

    fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    fireEvent.click(
      container.querySelector(".c-detour_map--original-route-shape")!
    )

    await userEvent.click(finishDetourButton.get())

    userEvent.click(screen.getByRole("button", { name: "Copy Details" }))

    await waitFor(() =>
      expect(window.navigator.clipboard.readText()).resolves.toBe("")
    )

    expect(
      await screen.findByRole("tooltip", { name: "Copied to clipboard!" })
    ).toBeVisible()
  })
})
