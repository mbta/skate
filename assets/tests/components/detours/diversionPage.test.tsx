import { jest, describe, test, expect, beforeEach } from "@jest/globals"
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import React, { ComponentProps } from "react"
import "@testing-library/jest-dom/jest-globals"
import { fetchDetourDirections, fetchFinishedDetour } from "../../../src/api"
import { DiversionPage as DiversionPageDefault } from "../../../src/components/detours/diversionPage"
import shapeFactory from "../../factories/shape"
import { latLngLiteralFactory } from "../../factories/latLngLiteralFactory"
import stopFactory from "../../factories/stop"
import userEvent from "@testing-library/user-event"
import {
  finishDetourButton,
  originalRouteShape,
} from "../../testHelpers/selectors/components/detours/diversionPage"
import {
  finishedDetourFactory,
  routeSegmentsFactory,
} from "../../factories/finishedDetourFactory"
import { detourShapeFactory } from "../../factories/detourShapeFactory"

const DiversionPage = (
  props: Omit<
    Partial<ComponentProps<typeof DiversionPageDefault>>,
    "originalRoute"
  > & {
    originalRoute?: Partial<
      ComponentProps<typeof DiversionPageDefault>["originalRoute"]
    >
  }
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
  jest.mocked(fetchFinishedDetour).mockResolvedValue(null)
})

describe("DiversionPage", () => {
  test("can click on route shape to start detour", async () => {
    const { container } = render(<DiversionPage />)

    fireEvent.click(originalRouteShape.get(container))

    expect(screen.getByTitle("Detour Start")).not.toBeNull()
    expect(screen.queryByTitle("Detour End")).toBeNull()
  })

  test("can click on route shape again to end detour", async () => {
    const { container } = render(<DiversionPage />)

    fireEvent.click(originalRouteShape.get(container))

    fireEvent.click(originalRouteShape.get(container))

    expect(screen.getByTitle("Detour End")).not.toBeNull()
  })

  test("when end point has been set, finish detour button is visible", async () => {
    const { container } = render(<DiversionPage />)

    fireEvent.click(originalRouteShape.get(container))

    expect(
      screen.getByRole("button", { name: "Finish Detour", hidden: true })
    ).not.toBeVisible()

    fireEvent.click(originalRouteShape.get(container))

    expect(screen.getByRole("button", { name: "Finish Detour" })).toBeVisible()
  })

  test("clicking on map while drawing a detour adds a point", async () => {
    const { container } = render(<DiversionPage />)

    fireEvent.click(originalRouteShape.get(container))

    fireEvent.click(container.querySelector(".c-vehicle-map")!)

    expect(
      container.querySelectorAll(".c-detour_map-circle-marker--detour-point")
    ).toHaveLength(1)
  })

  test("detour points are correctly rendered when detour is complete", async () => {
    const { container } = render(<DiversionPage />)

    fireEvent.click(originalRouteShape.get(container))

    fireEvent.click(container.querySelector(".c-vehicle-map")!)

    fireEvent.click(originalRouteShape.get(container))

    expect(
      container.querySelectorAll(".c-detour_map-circle-marker--detour-point")
    ).toHaveLength(1)
  })

  test("clicking on 'Undo' removes last point from detour", async () => {
    const { container } = render(<DiversionPage />)

    fireEvent.click(originalRouteShape.get(container))

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

    fireEvent.click(originalRouteShape.get(container))

    fireEvent.click(screen.getByRole("button", { name: "Undo" }))

    expect(screen.queryByTitle("Detour Start")).toBeNull()
  })

  test("clicking on 'Undo' removes the end point when the detour is finished", async () => {
    const { container } = render(<DiversionPage />)

    fireEvent.click(originalRouteShape.get(container))

    fireEvent.click(originalRouteShape.get(container))

    fireEvent.click(screen.getByRole("button", { name: "Undo" }))

    expect(screen.getByTitle("Detour Start")).not.toBeNull()
    expect(screen.queryByTitle("Detour End")).toBeNull()
  })

  test("clicking on 'Clear' removes the entire detour", async () => {
    const { container } = render(<DiversionPage />)

    fireEvent.click(originalRouteShape.get(container))

    fireEvent.click(container.querySelector(".c-vehicle-map")!)

    fireEvent.click(originalRouteShape.get(container))

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
    jest
      .mocked(fetchFinishedDetour)
      .mockResolvedValue(
        finishedDetourFactory.build({ missedStops: [stop1, stop2] })
      )

    const { container } = render(<DiversionPage />)

    await act(async () => {
      fireEvent.click(originalRouteShape.get(container))
    })

    await act(async () => {
      fireEvent.click(originalRouteShape.get(container))
    })

    waitFor(() => {
      expect(screen.getByText(stop1.name)).toBeInTheDocument()
      expect(screen.getByText(stop2.name)).toBeInTheDocument()
      expect(screen.getByText("2")).toBeInTheDocument()
    })
  })

  test("duplicate missed stops are only rendered once", async () => {
    const stop = stopFactory.build()
    jest
      .mocked(fetchFinishedDetour)
      .mockResolvedValue(
        finishedDetourFactory.build({ missedStops: [stop, stop] })
      )

    const { container } = render(<DiversionPage />)

    await act(async () => {
      fireEvent.click(originalRouteShape.get(container))
    })

    await act(async () => {
      fireEvent.click(originalRouteShape.get(container))
    })

    waitFor(() => expect(screen.getAllByText(stop.name)).toHaveLength(1))
  })

  test("When 'Finish Detour' button is clicked, shows 'Share Detour Details' screen", async () => {
    const { container } = render(<DiversionPage />)

    fireEvent.click(originalRouteShape.get(container))

    fireEvent.click(originalRouteShape.get(container))

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

    fireEvent.click(originalRouteShape.get(container))

    fireEvent.click(originalRouteShape.get(container))

    await userEvent.click(finishDetourButton.get())

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Detour is not editable from this screen."
    )
  })

  test("'Share Detour Details' screen has back button to edit detour again", async () => {
    const { container } = render(<DiversionPage />)

    fireEvent.click(originalRouteShape.get(container))

    fireEvent.click(originalRouteShape.get(container))

    await userEvent.click(finishDetourButton.get())

    expect(screen.getByRole("button", { name: "Edit Detour" })).toBeVisible()
  })

  test("'Share Detour Details' screen has button to copy details", async () => {
    const { container } = render(<DiversionPage />)

    fireEvent.click(originalRouteShape.get(container))

    fireEvent.click(originalRouteShape.get(container))

    await userEvent.click(finishDetourButton.get())

    expect(screen.getByRole("button", { name: "Copy Details" })).toBeVisible()
  })

  test("'Share Detour Details' screen copies text content to clipboard when clicked copy details button", async () => {
    const stops = stopFactory.buildList(4)
    const [start, end] = stopFactory.buildList(2)

    jest.mocked(fetchDetourDirections).mockResolvedValue(
      detourShapeFactory.build({
        directions: [
          { instruction: "Turn left on Main Street" },
          { instruction: "Turn right on High Street" },
          { instruction: "Turn sharp right on Broadway" },
        ],
      })
    )
    jest.mocked(fetchFinishedDetour).mockResolvedValue({
      missedStops: stops,
      connectionPoint: {
        start,
        end,
      },
      routeSegments: routeSegmentsFactory.build(),
    })

    userEvent.setup() // Configure the clipboard API

    const routeName = "route1"
    const routeOrigin = "Origin Station"
    const routeDescription = "Headsign via Bus"
    const routeDirection = "Outbound"
    const connectionPoint = { lat: 10, lon: 10 }
    const { container } = render(
      <DiversionPage
        originalRoute={{
          routeName,
          routeOrigin,
          routeDescription,
          routeDirection,
          shape: shapeFactory.build({
            points: [connectionPoint],
          }),
        }}
      />
    )

    fireEvent.click(originalRouteShape.get(container))

    fireEvent.click(originalRouteShape.get(container))

    await userEvent.click(finishDetourButton.get())

    await userEvent.click(screen.getByRole("button", { name: "Copy Details" }))

    await waitFor(() =>
      expect(window.navigator.clipboard.readText()).resolves.toBe(
        [
          "Detour:",
          `${routeName} ${routeDescription} from`,
          routeOrigin,
          routeDirection,
          ,
          "Turn-by-Turn Directions:",
          "Turn left on Main Street",
          "Turn right on High Street",
          "Turn sharp right on Broadway",
          ,
          "Connection Points:",
          start.name,
          end.name,
          ,
          `Missed Stops (${stops.length}):`,
          ...stops.map(({ name }) => name),
        ].join("\n")
      )
    )

    expect(
      await screen.findByRole("tooltip", { name: "Copied to clipboard!" })
    ).toBeVisible()
  })

  test("Attempting to close the page displays a confirmation modal", () => {
    render(<DiversionPage />)

    fireEvent.click(screen.getByRole("button", { name: "Close" }))

    expect(screen.getByRole("dialog")).toBeVisible()
    expect(screen.getByRole("button", { name: /yes/i })).toBeVisible()
    expect(screen.getByRole("button", { name: /back/i })).toBeVisible()
  })

  test("can close page from the confirmation modal", async () => {
    const onClose = jest.fn()

    render(<DiversionPage onClose={onClose} />)

    fireEvent.click(screen.getByRole("button", { name: "Close" }))

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /yes/i }))
    })

    expect(onClose).toHaveBeenCalled()

    expect(screen.queryByRole("dialog")).toBeNull()
  })

  test("can go back to the detour page from the confirmation modal", async () => {
    const onClose = jest.fn()

    render(<DiversionPage onClose={onClose} />)

    fireEvent.click(screen.getByRole("button", { name: "Close" }))

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /back/i }))
    })

    expect(onClose).not.toHaveBeenCalled()

    expect(screen.queryByRole("dialog")).toBeNull()
  })

  test("closing the confirmation modal returns to the detour page", async () => {
    const onClose = jest.fn()

    render(<DiversionPage onClose={onClose} />)

    fireEvent.click(screen.getByRole("button", { name: "Close" }))

    await act(async () => {
      const modal = screen.getByRole("dialog")
      fireEvent.click(within(modal).getByRole("button", { name: "Close" }))
    })

    expect(onClose).not.toHaveBeenCalled()

    expect(screen.queryByRole("dialog")).toBeNull()
  })

  test("stop markers are visible", async () => {
    const { container } = render(
      <DiversionPage
        originalRoute={{
          shape: shapeFactory.build({ stops: stopFactory.buildList(11) }),
        }}
      />
    )

    expect(container.querySelectorAll(".c-stop-icon-container")).toHaveLength(
      11
    )
  })
})
