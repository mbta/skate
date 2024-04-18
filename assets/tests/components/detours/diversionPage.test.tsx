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
import {
  FetchDetourDirectionsError,
  fetchDetourDirections,
  fetchFinishedDetour,
} from "../../../src/api"
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
import {
  missedStopIcon,
  stopIcon,
} from "../../testHelpers/selectors/components/map/markers/stopIcon"
import { Err, Ok } from "../../../src/util/result"

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
  const { originalRoute, showConfirmCloseModal, ...otherProps } = props
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
      showConfirmCloseModal={showConfirmCloseModal ?? false}
      {...otherProps}
    />
  )
}

beforeEach(() => {
  jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
})

jest.mock("../../../src/api")

beforeEach(() => {
  jest
    .mocked(fetchDetourDirections)
    .mockImplementation(() => new Promise(() => {}))
  jest.mocked(fetchFinishedDetour).mockResolvedValue(null)
})

describe("DiversionPage", () => {
  test("can click on route shape to start detour", async () => {
    const { container } = render(<DiversionPage />)

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    expect(await screen.findByTitle("Detour Start")).not.toBeNull()
    expect(screen.queryByTitle("Detour End")).not.toBeInTheDocument()
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

  test.each<{
    title: string
    directionsResult: Err<FetchDetourDirectionsError>
    alertError: string
  }>([
    {
      title: "No Route",
      directionsResult: Err({ type: "no_route" }),
      alertError:
        "You can't route to this location. Please try a different point.",
    },
    {
      title: "Unknown",
      directionsResult: Err({ type: "unknown" }),
      alertError: "Something went wrong. Please try again.",
    },
  ])(
    "when adding a point results in a `$title` routing error, displays an alert",
    async ({ alertError, directionsResult }) => {
      jest.mocked(fetchDetourDirections).mockResolvedValue(directionsResult)

      const { container } = render(<DiversionPage />)

      act(() => {
        fireEvent.click(originalRouteShape.get(container))
      })

      act(() => {
        fireEvent.click(container.querySelector(".c-vehicle-map")!)
      })

      expect(await screen.findByRole("alert")).toHaveTextContent(alertError)
    }
  )

  test("routing error alert can be dismissed", async () => {
    jest
      .mocked(fetchDetourDirections)
      .mockResolvedValue(Err({ type: "unknown" }))

    const { container } = render(<DiversionPage />)

    await act(async () => {
      fireEvent.click(originalRouteShape.get(container))
    })

    await act(async () => {
      fireEvent.click(container.querySelector(".c-vehicle-map")!)
    })

    await waitFor(async () =>
      expect(
        screen.getByText("Something went wrong. Please try again.")
      ).toBeInTheDocument()
    )

    await act(async () => {
      fireEvent.click(within(screen.getByRole("alert")).getByRole("button"))
    })

    await waitFor(async () =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    )
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

    await waitFor(() =>
      expect(
        container.querySelectorAll(".c-detour_map-circle-marker--detour-point")
      ).toHaveLength(0)
    )
  })

  test("'Undo' and 'Clear' are disabled before detour drawing is started", async () => {
    render(<DiversionPage />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled()
      expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled()
    })
  })

  test("clicking on 'Undo' removes the start point when there are no waypoints", async () => {
    const { container } = render(<DiversionPage />)

    fireEvent.click(originalRouteShape.get(container))

    fireEvent.click(screen.getByRole("button", { name: "Undo" }))

    await waitFor(() => expect(screen.queryByTitle("Detour Start")).toBeNull())
  })

  test("clicking on 'Undo' removes the end point when the detour is finished", async () => {
    const { container } = render(<DiversionPage />)

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Undo" }))
    })

    await waitFor(() => {
      expect(screen.getByTitle("Detour Start")).not.toBeNull()
      expect(screen.queryByTitle("Detour End")).toBeNull()
    })
  })

  test("clicking on 'Clear' removes the entire detour", async () => {
    const { container } = render(<DiversionPage />)

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    act(() => {
      fireEvent.click(container.querySelector(".c-vehicle-map")!)
    })

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Clear" }))
    })

    await waitFor(() =>
      expect(
        container.querySelectorAll(".c-detour_map-circle-marker--detour-point")
      ).toHaveLength(0)
    )

    expect(screen.queryByTitle("Detour Start")).toBeNull()
    expect(screen.queryByTitle("Detour End")).toBeNull()
  })

  test("shows 'Regular Route' text when the detour is finished", async () => {
    jest.mocked(fetchDetourDirections).mockResolvedValue(
      Ok(
        detourShapeFactory.build({
          directions: [
            { instruction: "Turn left on Main Street" },
            { instruction: "Turn right on High Street" },
            { instruction: "Turn sharp right on Broadway" },
          ],
        })
      )
    )

    jest
      .mocked(fetchFinishedDetour)
      .mockResolvedValue(finishedDetourFactory.build())

    const { container } = render(<DiversionPage />)

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    expect(await screen.findByText("Regular Route")).toBeVisible()
  })

  test("does not show 'Regular Route' when detour is not finished", async () => {
    jest.mocked(fetchDetourDirections).mockResolvedValue(
      Ok(
        detourShapeFactory.build({
          directions: [
            { instruction: "Turn left on Main Street" },
            { instruction: "Turn right on High Street" },
            { instruction: "Turn sharp right on Broadway" },
          ],
        })
      )
    )

    jest
      .mocked(fetchFinishedDetour)
      .mockResolvedValue(finishedDetourFactory.build())

    const { container } = render(<DiversionPage />)

    expect(screen.queryByText("Regular Route")).not.toBeInTheDocument()

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    expect(await screen.findByText("Regular Route")).toBeVisible()

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Undo" }))
    })

    await waitFor(() =>
      expect(screen.queryByText("Regular Route")).not.toBeInTheDocument()
    )
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
      Ok(
        detourShapeFactory.build({
          directions: [
            { instruction: "Turn left on Main Street" },
            { instruction: "Turn right on High Street" },
            { instruction: "Turn sharp right on Broadway" },
          ],
        })
      )
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
          "Regular Route",
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

  test("Attempting to close the page calls the onClose callback", async () => {
    const onClose = jest.fn()

    render(<DiversionPage onClose={onClose} />)

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Close" }))
    })

    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  test("Displays a confirmation modal", async () => {
    render(<DiversionPage showConfirmCloseModal={true} />)

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeVisible()
      expect(screen.getByRole("button", { name: /yes/i })).toBeVisible()
      expect(screen.getByRole("button", { name: /back/i })).toBeVisible()
    })
  })

  test("calls the onConfirmClose callback from the confirmation modal", async () => {
    const onConfirmClose = jest.fn()

    render(
      <DiversionPage
        showConfirmCloseModal={true}
        onConfirmClose={onConfirmClose}
      />
    )

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /yes/i }))
    })

    expect(onConfirmClose).toHaveBeenCalled()
  })

  test("canceling close from the confirmation modal calls onCancelClose", async () => {
    const onCancelClose = jest.fn()
    const onConfirmClose = jest.fn()

    render(
      <DiversionPage
        showConfirmCloseModal={true}
        onCancelClose={onCancelClose}
        onConfirmClose={onConfirmClose}
      />
    )

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /back/i }))
    })

    expect(onCancelClose).toHaveBeenCalled()
    expect(onConfirmClose).not.toHaveBeenCalled()
  })

  test("closing the confirmation modal calls onCancelClose", async () => {
    const onCancelClose = jest.fn()
    const onConfirmClose = jest.fn()

    render(
      <DiversionPage
        showConfirmCloseModal={true}
        onCancelClose={onCancelClose}
        onConfirmClose={onConfirmClose}
      />
    )

    await act(async () => {
      const modal = screen.getByRole("dialog")
      fireEvent.click(within(modal).getByRole("button", { name: "Close" }))
    })

    expect(onCancelClose).toHaveBeenCalled()
    expect(onConfirmClose).not.toHaveBeenCalled()
  })

  test("stop markers are visible", async () => {
    const { container } = render(
      <DiversionPage
        originalRoute={{
          shape: shapeFactory.build({ stops: stopFactory.buildList(11) }),
        }}
      />
    )

    await waitFor(() =>
      expect(container.querySelectorAll(".c-stop-icon")).toHaveLength(11)
    )
  })

  test("missed stop markers are drawn on the map", async () => {
    const stop1 = stopFactory.build()
    const stop2 = stopFactory.build()
    const stop3 = stopFactory.build()
    const stop4 = stopFactory.build()

    jest
      .mocked(fetchFinishedDetour)
      .mockResolvedValue(finishedDetourFactory.build({ missedStops: [stop2] }))

    const { container } = render(
      <DiversionPage
        originalRoute={{
          shape: shapeFactory.build({ stops: [stop1, stop2, stop3, stop4] }),
        }}
      />
    )

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })
    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    waitFor(() => {
      expect(stopIcon.getAll(container)).toHaveLength(3)
      expect(missedStopIcon.getAll(container)).toHaveLength(1)
    })
  })
})
