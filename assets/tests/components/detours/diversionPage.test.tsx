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
  fetchNearestIntersection,
  fetchRoutePatterns,
} from "../../../src/api"
import { DiversionPage as DiversionPageDefault } from "../../../src/components/detours/diversionPage"
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
import { neverPromise } from "../../testHelpers/mockHelpers"
import { originalRouteFactory } from "../../factories/originalRouteFactory"
import { DeepPartial } from "fishery"
import getTestGroups from "../../../src/userTestGroups"
import { TestGroups } from "../../../src/userInTestGroup"
import { routePatternFactory } from "../../factories/routePattern"
import { RoutesProvider } from "../../../src/contexts/routesContext"
import routeFactory from "../../factories/route"
import { patternDisplayName } from "../../../src/components/mapPage/routePropertiesCard"
import { RoutePattern } from "../../../src/schedule"

const DiversionPage = (
  props: Omit<
    Partial<ComponentProps<typeof DiversionPageDefault>>,
    "originalRoute"
  > & {
    originalRoute?: DeepPartial<
      ComponentProps<typeof DiversionPageDefault>["originalRoute"]
    >
  }
) => {
  const { originalRoute, showConfirmCloseModal, ...otherProps } = props
  return (
    <DiversionPageDefault
      originalRoute={originalRouteFactory.build(originalRoute)}
      showConfirmCloseModal={showConfirmCloseModal ?? false}
      {...otherProps}
    />
  )
}

function rpcRadioButtonName(rp: RoutePattern) {
  const { name, description } = patternDisplayName(rp)
  return name + " " + description
}

beforeEach(() => {
  jest.spyOn(global, "scrollTo").mockImplementationOnce(jest.fn())
})

jest.mock("../../../src/api")
jest.mock("../../../src/userTestGroups")

beforeEach(() => {
  jest.mocked(fetchDetourDirections).mockReturnValue(neverPromise())
  jest.mocked(fetchFinishedDetour).mockReturnValue(neverPromise())
  jest.mocked(fetchNearestIntersection).mockReturnValue(neverPromise())
  jest.mocked(fetchRoutePatterns).mockReturnValue(neverPromise())
  jest.mocked(getTestGroups).mockReturnValue([])
})

describe("DiversionPage", () => {
  test("starts out with no start point, end point, or waypoints", async () => {
    const { container } = render(<DiversionPage />)

    await waitFor(() => {
      expect(screen.queryByTitle("Detour Start")).not.toBeInTheDocument()
      expect(screen.queryByTitle("Detour End")).not.toBeInTheDocument()
      expect(
        container.querySelectorAll(".c-detour_map-circle-marker--detour-point")
      ).toHaveLength(0)
    })
  })

  test("can click on route shape to start detour", async () => {
    const { container } = render(<DiversionPage />)

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    expect(await screen.findByTitle("Detour Start")).toBeVisible()
    expect(screen.queryByTitle("Detour End")).not.toBeInTheDocument()
  })

  test("has a normal cursor before placing the start point", async () => {
    const { container } = render(<DiversionPage />)

    await waitFor(() => {
      expect(
        container.querySelector(".c-detour_map--map__clickable")
      ).not.toBeInTheDocument()
    })
  })

  test("has a waypoint cursor, given by the __clickable class, once the start point is placed", async () => {
    const { container } = render(<DiversionPage />)

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    await waitFor(() => {
      expect(
        container.querySelector(".c-detour_map--map__clickable")
      ).toBeInTheDocument()
    })
  })

  test("has no waypoints when placing the start point", async () => {
    const { container } = render(<DiversionPage />)

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    await waitFor(() => {
      expect(screen.getByTitle("Detour Start")).toBeVisible()
    })

    expect(
      container.querySelectorAll(".c-detour_map-circle-marker--detour-point")
    ).toHaveLength(0)
  })

  test("can click on map to add a waypoint", async () => {
    const { container } = render(<DiversionPage />)

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })
    act(() => {
      fireEvent.click(container.querySelector(".c-vehicle-map")!)
    })

    await waitFor(() => {
      expect(
        container.querySelectorAll(".c-detour_map-circle-marker--detour-point")
      ).toHaveLength(1)
    })
  })

  test("directions starts out with placeholder text", async () => {
    render(<DiversionPage />)

    const { getByText } = within(
      screen
        .getByRole("heading", { name: "Detour Directions" })
        .closest("section")!
    )

    await waitFor(() => {
      expect(
        getByText(
          "Click a point on the regular route to start drawing your detour. As you continue to select points on the map, turn-by-turn directions will appear in this panel."
        )
      ).toBeVisible()
    })
  })

  test("calls the API when the first waypoint is added", async () => {
    const { container } = render(<DiversionPage />)

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    act(() => {
      fireEvent.click(container.querySelector(".c-vehicle-map")!)
    })

    await waitFor(() => {
      expect(fetchDetourDirections).toHaveBeenCalledTimes(1)
    })
  })

  test("calls the API twice when a waypoint is added and then the detour is finished", async () => {
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

    await waitFor(() => {
      expect(fetchDetourDirections).toHaveBeenCalledTimes(2)
    })
  })

  test("directions is populated with the origin intersection and directions from the backend when second waypoint is added", async () => {
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

    const intersection = "Avenue 1 & Street 2"
    jest.mocked(fetchNearestIntersection).mockResolvedValue(intersection)

    const { container } = render(<DiversionPage />)

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    act(() => {
      fireEvent.click(container.querySelector(".c-vehicle-map")!)
    })

    await waitFor(() => {
      const { getByText } = within(
        screen
          .getByRole("heading", { name: "Detour Directions" })
          .closest("section")!
      )

      expect(getByText("From Avenue 1 & Street 2")).toBeVisible()
      expect(getByText("Turn left on Main Street")).toBeVisible()
      expect(getByText("Turn right on High Street")).toBeVisible()
      expect(getByText("Turn sharp right on Broadway")).toBeVisible()
    })
  })

  test("can click on route shape again to end detour", async () => {
    const { container } = render(<DiversionPage />)

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    expect(screen.getByTitle("Detour End")).toBeVisible()
  })

  test("clicking on route shape after the detour is ended doesn't do anything", async () => {
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

    await waitFor(() => {
      expect(screen.getByTitle("Detour End")).toBeVisible()
    })

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    await waitFor(() => {
      expect(screen.getAllByTitle("Detour Start")).toHaveLength(1)

      expect(
        container.querySelectorAll(".c-detour_map-circle-marker--detour-point")
      ).toHaveLength(1)

      expect(screen.getAllByTitle("Detour End")).toHaveLength(1)
    })
  })

  test("clicking on the map after the detour is ended doesn't do anything", async () => {
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

    await waitFor(() => {
      expect(screen.getByTitle("Detour End")).toBeVisible()
    })

    act(() => {
      fireEvent.click(container.querySelector(".c-vehicle-map")!)
    })

    await waitFor(() => {
      expect(screen.getAllByTitle("Detour Start")).toHaveLength(1)

      expect(
        container.querySelectorAll(".c-detour_map-circle-marker--detour-point")
      ).toHaveLength(1)

      expect(screen.getAllByTitle("Detour End")).toHaveLength(1)
    })
  })

  test("when end point has been set, has a normal cursor again", async () => {
    const { container } = render(<DiversionPage />)

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    await waitFor(() => {
      expect(
        container.querySelector(".c-detour_map--map__clickable")
      ).toBeInTheDocument()
    })

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    await waitFor(() => {
      expect(
        container.querySelector(".c-detour_map--map__clickable")
      ).not.toBeInTheDocument()
    })
  })

  test("when end point has been set, finish detour button is visible", async () => {
    const { container } = render(<DiversionPage />)

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    expect(
      screen.getByRole("button", { name: "Finish Detour", hidden: true })
    ).not.toBeVisible()

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    expect(screen.getByRole("button", { name: "Finish Detour" })).toBeVisible()
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

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    act(() => {
      fireEvent.click(container.querySelector(".c-vehicle-map")!)
    })

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    await waitFor(() =>
      expect(
        container.querySelectorAll(".c-detour_map-circle-marker--detour-point")
      ).toHaveLength(1)
    )
  })

  test("clicking on 'Undo' removes last point from detour", async () => {
    const { container } = render(<DiversionPage />)

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    act(() => {
      fireEvent.click(container.querySelector(".c-vehicle-map")!)
    })

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Undo" }))
    })

    await waitFor(() =>
      expect(
        container.querySelectorAll(".c-detour_map-circle-marker--detour-point")
      ).toHaveLength(0)
    )

    expect(screen.queryByTitle("Detour Start")).toBeVisible()
  })

  test("clicking on 'Undo' restores the placeholder text when appropriate", async () => {
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

    const { container } = render(<DiversionPage />)
    const { queryByText, getByText } = within(
      screen
        .getByRole("heading", { name: "Detour Directions" })
        .closest("section")!
    )

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })
    act(() => {
      fireEvent.click(container.querySelector(".c-vehicle-map")!)
    })
    await waitFor(() => {
      expect(
        queryByText(
          "Click a point on the regular route to start drawing your detour. As you continue to select points on the map, turn-by-turn directions will appear in this panel."
        )
      ).not.toBeInTheDocument()

      expect(getByText("Turn left on Main Street")).toBeVisible()
    })

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Undo" }))
    })
    await waitFor(() => {
      expect(
        getByText(
          "Click a point on the regular route to start drawing your detour. As you continue to select points on the map, turn-by-turn directions will appear in this panel."
        )
      ).toBeVisible()

      expect(queryByText("Turn left on Main Street")).not.toBeInTheDocument()
    })
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

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Undo" }))
    })

    await waitFor(() => expect(screen.queryByTitle("Detour Start")).toBeNull())
  })

  test("when clicking on 'Undo' removes the start point, then 'Undo' becomes disabled", async () => {
    const { container } = render(<DiversionPage />)

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Undo" })).not.toBeDisabled()
    })

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Undo" }))
    })

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled()
      expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled()
    })
  })

  test("clicking on 'Undo' removes the end point when the detour is finished", async () => {
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
      fireEvent.click(screen.getByRole("button", { name: "Undo" }))
    })

    await waitFor(() => {
      expect(screen.getByTitle("Detour Start")).toBeVisible()
      expect(screen.queryByTitle("Detour End")).toBeNull()
      expect(
        container.querySelectorAll(".c-detour_map-circle-marker--detour-point")
      ).toHaveLength(1)
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

  test("clicking on 'Clear' disables 'Undo' and 'Clear'", async () => {
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

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled()
      expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled()
    })
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

    await waitFor(() => {
      expect(screen.getByText("Regular Route")).toBeVisible()
    })
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

    await waitFor(() => {
      expect(screen.queryByText("Regular Route")).not.toBeInTheDocument()
    })

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    await waitFor(() => {
      expect(screen.getByText("Regular Route")).toBeVisible()
    })

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Undo" }))
    })

    await waitFor(() =>
      expect(screen.queryByText("Regular Route")).not.toBeInTheDocument()
    )
  })

  test("missed stops section is absent before detour is complete", async () => {
    jest
      .mocked(fetchFinishedDetour)
      .mockResolvedValue(
        finishedDetourFactory.build({ missedStops: stopFactory.buildList(2) })
      )

    const { container } = render(<DiversionPage />)

    expect(screen.queryByText("Missed Stops")).not.toBeInTheDocument()

    await act(async () => {
      fireEvent.click(originalRouteShape.get(container))
    })

    await waitFor(() => {
      expect(screen.getByTitle("Detour Start")).toBeVisible()
    })

    expect(screen.queryByText("Missed Stops")).not.toBeInTheDocument()
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

    await waitFor(() => {
      expect(screen.getByText("Missed Stops")).toBeVisible()
    })

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Missed Stops 2" })
      ).toBeVisible()
    })

    const { getByText } = within(
      screen
        .getByRole("heading", { name: "Missed Stops 2" })
        .closest("section")!
    )

    expect(getByText(stop1.name)).toBeInTheDocument()
    expect(getByText(stop2.name)).toBeInTheDocument()
    expect(getByText("2")).toBeInTheDocument()
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

    await waitFor(() => expect(screen.getAllByText(stop.name)).toHaveLength(1))
  })

  test("missed stops are absent after a completed detour is 'undo'ne", async () => {
    jest
      .mocked(fetchFinishedDetour)
      .mockResolvedValue(
        finishedDetourFactory.build({ missedStops: stopFactory.buildList(2) })
      )

    const { container } = render(<DiversionPage />)

    await act(async () => {
      fireEvent.click(originalRouteShape.get(container))
    })

    await act(async () => {
      fireEvent.click(originalRouteShape.get(container))
    })

    await waitFor(() => {
      expect(screen.getByText("Missed Stops")).toBeVisible()
    })

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Undo" }))
    })

    await waitFor(() => {
      expect(screen.queryByText("Missed Stops")).not.toBeInTheDocument()
    })
  })

  test("calls the API after undo'ing if there is still at least one waypoint left", async () => {
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
      fireEvent.click(screen.getByRole("button", { name: "Undo" }))
    })

    await waitFor(() => {
      /**
       * Three calls:
       * 1. Adding the first waypoint
       * 2. Adding the end point
       * 3. Removing the end point, and mapping just to the first waypoint again
       **/
      expect(fetchDetourDirections).toHaveBeenCalledTimes(3)
    })
  })

  test("When 'Finish Detour' button is clicked, shows 'Share Detour Details' screen", async () => {
    const { container } = render(<DiversionPage />)

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

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

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    await userEvent.click(finishDetourButton.get())

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Detour shape is not editable from this screen."
    )
  })

  test("'Share Detour Details' screen disables the 'Undo' and 'Clear' buttons", async () => {
    const { container } = render(<DiversionPage />)

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    await userEvent.click(finishDetourButton.get())

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled()
      expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled()
    })
  })

  test("'Share Detour Details' screen has back button to edit detour again", async () => {
    const { container } = render(<DiversionPage />)

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    await userEvent.click(finishDetourButton.get())

    expect(screen.getByRole("button", { name: "Edit Detour" })).toBeVisible()
  })

  test("'Share Detour Details' screen returns to editing screen when edit detour button is clicked", async () => {
    const { container } = render(<DiversionPage />)

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    await userEvent.click(finishDetourButton.get())

    await userEvent.click(
      await screen.findByRole("button", { name: "Edit Detour" })
    )

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Edit Detour" })
      ).not.toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: "Finish Detour" })
      ).toBeVisible()

      expect(screen.getByRole("button", { name: "Undo" })).not.toBeDisabled()
      expect(screen.getByRole("button", { name: "Clear" })).not.toBeDisabled()
    })
  })

  test("'Share Detour Details' screen has button to copy details", async () => {
    const { container } = render(<DiversionPage />)

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

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

    const intersection = "Avenue 1 & Street 2"
    jest.mocked(fetchNearestIntersection).mockResolvedValue(intersection)

    userEvent.setup() // Configure the clipboard API

    const routeName = "route1"
    const routeOrigin = "Origin Station"
    const routeDescription = "Headsign via Bus"
    const routeDirection = "Outbound"
    const connectionPoint = { lat: 10, lon: 10 }
    const { container } = render(
      <DiversionPage
        originalRoute={{
          route: {
            name: routeName,
          },
          routePattern: {
            headsign: routeDescription,
            name: routeOrigin,
            shape: {
              points: [connectionPoint],
            },
          },
        }}
      />
    )

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    await userEvent.click(finishDetourButton.get())

    await userEvent.click(screen.getByRole("button", { name: "Copy Details" }))

    await waitFor(() =>
      expect(window.navigator.clipboard.readText()).resolves.toBe(
        [
          `Detour ${routeName} ${routeDirection}`,
          routeOrigin,
          ,
          "Connection Points:",
          start.name,
          end.name,
          ,
          `Missed Stops (${stops.length}):`,
          ...stops.map(({ name }) => name),
          ,
          "Turn-by-Turn Directions:",
          "From Avenue 1 & Street 2",
          "Turn left on Main Street",
          "Turn right on High Street",
          "Turn sharp right on Broadway",
          "Regular Route",
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
          routePattern: {
            shape: {
              stops: stopFactory.buildList(11),
            },
          },
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
          routePattern: {
            shape: {
              stops: [stop1, stop2, stop3, stop4],
            },
          },
        }}
      />
    )

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })
    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    await waitFor(() => {
      expect(stopIcon.getAll(container)).toHaveLength(3)
      expect(missedStopIcon.getAll(container)).toHaveLength(1)
    })
  })

  describe("'Change route or direction' button", () => {
    test("when not in test group, is not present", async () => {
      render(<DiversionPage />)

      expect(
        await screen.findByRole("heading", { name: "Create Detour" })
      ).toBeInTheDocument()
      expect(
        screen.queryByRole("button", { name: "Change route or direction" })
      ).not.toBeInTheDocument()
    })

    test("when in test group, is visible", async () => {
      jest
        .mocked(getTestGroups)
        .mockReturnValue([TestGroups.DetourRouteSelection])
      jest
        .mocked(fetchRoutePatterns)
        .mockResolvedValue(routePatternFactory.buildList(1, { id: "66_666" }))

      render(
        <DiversionPage originalRoute={{ routePattern: { id: "66_666" } }} />
      )

      expect(
        await screen.findByRole("heading", { name: "Create Detour" })
      ).toBeInTheDocument()
      expect(
        screen.queryByRole("button", { name: "Change route or direction" })
      ).toBeInTheDocument()
    })

    test("when clicked, shows the route selection panel", async () => {
      jest
        .mocked(getTestGroups)
        .mockReturnValue([TestGroups.DetourRouteSelection])

      const routePatterns = routePatternFactory.buildList(1, { id: "66_666" })
      const [routePattern] = routePatterns
      jest.mocked(fetchRoutePatterns).mockResolvedValue(routePatterns)

      render(<DiversionPage originalRoute={{ routePattern }} />)

      await userEvent.click(
        await screen.findByRole("button", { name: "Change route or direction" })
      )

      expect(
        await screen.getByRole("heading", { name: "Choose route" })
      ).toBeVisible()
    })

    test("when clicked, clears any existing detour state", async () => {
      jest
        .mocked(getTestGroups)
        .mockReturnValue([TestGroups.DetourRouteSelection])

      const route = routeFactory.build()
      const routePatterns = routePatternFactory.buildList(2, {
        routeId: route.id,
      })
      jest.mocked(fetchRoutePatterns).mockResolvedValue(routePatterns)

      const { container } = render(
        <RoutesProvider routes={[route]}>
          <DiversionPage
            originalRoute={{
              route,
              routePattern: routePatterns[0],
            }}
          />
        </RoutesProvider>
      )

      act(() => {
        fireEvent.click(originalRouteShape.get(container))
      })
      act(() => {
        fireEvent.click(container.querySelector(".c-vehicle-map")!)
      })
      act(() => {
        fireEvent.click(originalRouteShape.get(container))
      })

      // Assert that we have detour points
      expect(await screen.findByTitle("Detour Start")).toBeVisible()
      expect(screen.getByTitle("Detour End")).toBeVisible()
      expect(
        container.querySelector(".c-detour_map-circle-marker--detour-point")
      ).toBeVisible()

      // Assert that drawing is gone on route selection mode
      await userEvent.click(
        screen.getByRole("button", { name: "Change route or direction" })
      )

      expect(screen.queryByTitle("Detour Start")).not.toBeInTheDocument()
      expect(screen.queryByTitle("Detour End")).not.toBeInTheDocument()
      expect(
        container.querySelector(".c-detour_map-circle-marker--detour-point")
      ).not.toBeInTheDocument()

      // Assert that detour is still cleared when returning to drawing detours
      await userEvent.click(
        screen.getByRole("button", { name: "Start drawing detour" })
      )

      expect(screen.queryByTitle("Detour Start")).not.toBeInTheDocument()
      expect(screen.queryByTitle("Detour End")).not.toBeInTheDocument()
      expect(
        container.querySelector(".c-detour_map-circle-marker--detour-point")
      ).not.toBeInTheDocument()

      // Assert that route is still clickable
      act(() => {
        fireEvent.click(originalRouteShape.get(container))
      })
      expect(await screen.findByTitle("Detour Start")).toBeVisible()
      expect(screen.queryByTitle("Detour End")).not.toBeInTheDocument()
      expect(
        container.querySelector(".c-detour_map-circle-marker--detour-point")
      ).not.toBeInTheDocument()
    })
  })

  describe("'Route Selection Panel'", () => {
    beforeEach(() => {
      // Access to this panel via the "Change route or direction" button requires a test group currently
      jest
        .mocked(getTestGroups)
        .mockReturnValue([TestGroups.DetourRouteSelection])
    })

    test("can change route", async () => {
      const routes = routeFactory.buildList(2)
      const [initialRoute, targetRoute] = routes

      const initialRoutePatterns = routePatternFactory.buildList(2, {
        routeId: initialRoute.id,
      })
      const [initialRoutePattern] = initialRoutePatterns

      const numberOfTargetRoutePatterns = 10
      const targetRoutePatterns = routePatternFactory.buildList(
        numberOfTargetRoutePatterns,
        {
          routeId: targetRoute.id,
          directionId: 1,
        }
      )

      jest.mocked(fetchRoutePatterns).mockImplementation(async (routeId) => {
        switch (routeId) {
          case initialRoute.id: {
            return initialRoutePatterns
          }
          case targetRoute.id: {
            return targetRoutePatterns
          }
          default: {
            return []
          }
        }
      })

      render(
        <RoutesProvider routes={routes}>
          <DiversionPage
            originalRoute={{
              routePattern: initialRoutePattern,
              route: initialRoute,
            }}
          />
        </RoutesProvider>
      )

      await userEvent.click(
        await screen.findByRole("button", { name: "Change route or direction" })
      )

      expect(
        await within(
          screen.getByRole("group", { name: "Variants" })
        ).findAllByRole("radio")
      ).toHaveLength(2)

      await userEvent.selectOptions(
        screen.getByRole("combobox", { name: "Choose route" }),
        targetRoute.id
      )

      expect(
        await within(
          screen.getByRole("group", { name: "Variants" })
        ).findAllByRole("radio")
      ).toHaveLength(numberOfTargetRoutePatterns)
    })

    test("can change route pattern", async () => {
      const route = routeFactory.build()
      const routePatterns = routePatternFactory.buildList(4, {
        routeId: route.id,
      })
      const [, startingRoutePattern, , targetRoutePattern] = routePatterns

      jest.mocked(fetchRoutePatterns).mockResolvedValue(routePatterns)

      render(
        <RoutesProvider routes={[route]}>
          <DiversionPage
            originalRoute={{ routePattern: startingRoutePattern, route }}
          />
        </RoutesProvider>
      )

      await userEvent.click(
        await screen.findByRole("button", { name: "Change route or direction" })
      )

      const targetPatternRadioButton = screen.getByRole("radio", {
        name: rpcRadioButtonName(targetRoutePattern),
      })

      await userEvent.click(targetPatternRadioButton)

      expect(targetPatternRadioButton).toBeChecked()
    })

    test("when finish button is clicked, returns to detour creation screen", async () => {
      const route = routeFactory.build({ id: "66" })
      const routePatterns = routePatternFactory.buildList(2, {
        routeId: route.id,
      })
      const [rp1] = routePatterns

      jest.mocked(fetchRoutePatterns).mockResolvedValue(routePatterns)

      render(
        <RoutesProvider routes={[route]}>
          <DiversionPage originalRoute={{ routePattern: rp1, route }} />
        </RoutesProvider>
      )

      await userEvent.click(
        screen.getByRole("button", { name: "Change route or direction" })
      )

      await userEvent.click(
        screen.getByRole("button", { name: "Start drawing detour" })
      )

      expect(
        await screen.findByRole("heading", { name: "Affected route" })
      ).toBeVisible()
      expect(screen.getByText(route.name)).toBeVisible()
      expect(screen.getByText(rp1.headsign!)).toBeVisible()
    })

    test("when a route pattern is already selected, opens to selected pattern", async () => {
      const route = routeFactory.build()
      const routePatterns = routePatternFactory.buildList(20, {
        routeId: route.id,
      })
      const selectedRoutePattern = routePatterns.at(-1)!
      expect(selectedRoutePattern).not.toBeUndefined()

      jest.mocked(fetchRoutePatterns).mockResolvedValue(routePatterns)

      render(
        <RoutesProvider routes={[route]}>
          <DiversionPage
            originalRoute={{ route, routePattern: selectedRoutePattern }}
          />
        </RoutesProvider>
      )

      await userEvent.click(
        screen.getByRole("button", { name: "Change route or direction" })
      )

      expect(
        screen.getByRole("combobox", { name: "Choose route" })
      ).toHaveValue(selectedRoutePattern.routeId)
      expect(
        screen.getByRole("radio", {
          name: rpcRadioButtonName(selectedRoutePattern),
        })
      ).toBeChecked()
    })

    test("when route is changed, selects first 'inbound' route pattern first", async () => {
      const routes = routeFactory.buildList(2)
      const [route1, route2] = routes

      const inboundRoutePatterns = routePatternFactory.buildList(2, {
        routeId: route2.id,
        directionId: 1,
      })
      const outboundRoutePatterns = routePatternFactory.buildList(2, {
        routeId: route2.id,
        directionId: 0,
      })
      const routePatterns = outboundRoutePatterns.concat(inboundRoutePatterns)

      const [selectedRoutePattern] = inboundRoutePatterns

      jest.mocked(fetchRoutePatterns).mockResolvedValue(routePatterns)

      render(
        <RoutesProvider routes={routes}>
          <DiversionPage
            originalRoute={{
              route: route1,
              routePattern: routePatternFactory.build({ routeId: route1.id }),
            }}
          />
        </RoutesProvider>
      )

      await userEvent.click(
        screen.getByRole("button", { name: "Change route or direction" })
      )

      await userEvent.selectOptions(
        screen.getByRole("combobox", { name: "Choose route" }),
        route2.name
      )

      expect(screen.getByRole("radio", { name: "Inbound" })).toBeChecked()

      await waitFor(() => {
        expect(
          screen.getByRole("radio", {
            name: rpcRadioButtonName(selectedRoutePattern),
          })
        ).toBeChecked()
      })
    })

    test("when route is changed from a route to empty, can still select another route", async () => {
      const route = routeFactory.build()

      const routePatterns = routePatternFactory.buildList(3, {
        routeId: route.id,
      })

      const [routePattern] = routePatterns

      jest.mocked(fetchRoutePatterns).mockResolvedValue(routePatterns)

      render(
        <RoutesProvider routes={[route]}>
          <DiversionPage
            originalRoute={{
              route,
              routePattern,
            }}
          />
        </RoutesProvider>
      )

      await userEvent.click(
        screen.getByRole("button", { name: "Change route or direction" })
      )

      await userEvent.selectOptions(
        screen.getByRole("combobox", { name: "Choose route" }),
        route.name
      )
      await userEvent.selectOptions(
        screen.getByRole("combobox", { name: "Choose route" }),
        "Select a route"
      )

      expect(
        screen.getByText("Select a route in order to choose a direction.")
      ).toBeVisible()

      await userEvent.selectOptions(
        screen.getByRole("combobox", { name: "Choose route" }),
        route.name
      )

      await waitFor(() => {
        expect(
          screen.getByRole("radio", {
            name: rpcRadioButtonName(routePattern),
          })
        ).toBeChecked()
      })
    })

    test("when route is changed, selects first route pattern otherwise", async () => {
      const routes = routeFactory.buildList(2)
      const [route1, route2] = routes

      const outboundRoutePatterns = routePatternFactory.buildList(2, {
        routeId: route2.id,
        directionId: 0,
      })
      const routePatterns = outboundRoutePatterns

      const [selectedRoutePattern] = outboundRoutePatterns

      jest.mocked(fetchRoutePatterns).mockResolvedValue(routePatterns)

      render(
        <RoutesProvider routes={routes}>
          <DiversionPage
            originalRoute={{
              route: route1,
              routePattern: routePatternFactory.build({ routeId: route1.id }),
            }}
          />
        </RoutesProvider>
      )

      await userEvent.click(
        screen.getByRole("button", { name: "Change route or direction" })
      )

      await userEvent.selectOptions(
        screen.getByRole("combobox", { name: "Choose route" }),
        route2.name
      )

      expect(screen.getByRole("radio", { name: "Outbound" })).toBeChecked()

      await waitFor(() => {
        expect(
          screen.getByRole("radio", {
            name: rpcRadioButtonName(selectedRoutePattern),
          })
        ).toBeChecked()
      })
    })

    test("when no route is selected, clicking the finish button shows error message", async () => {
      const routes = routeFactory.buildList(2)

      render(
        <RoutesProvider routes={routes}>
          <DiversionPage
            originalRoute={{
              routePattern: undefined,
              route: undefined,
            }}
          />
        </RoutesProvider>
      )

      // Originally, this test tried the matcher `toBeVisible` instead of
      // `toHaveAccessibleErrorMessage`. This would cause issues where the
      // `toBeVisible` assertion would pass even if the start button wasn't
      // clicked or the form was valid. That meant that this test didn't assert
      // that the error was _reactive_.
      //
      // To assert that the test was reactive, a `not.toBeVisible` assertion was
      // added before the click event, which ensured that it wasn't otherwise
      // present.  This also failed because the (react-)bootstrap component
      // which provides this text uses CSS for controlling visibility, which we
      // don't have access to in our tests at this time.
      //
      // So instead, `toHaveAccessibleErrorMessage` was chosen because it
      // asserted both the content of the error and that it was linked to the
      // combobox semantically at the correct [point in time/state].
      //
      // Additionally, `toBeVisible` doesn't test the accessibility semantics of
      // the form component, so `toHaveAccessibleErrorMessage` is better anyway.
      expect(
        screen.getByRole("combobox", { name: "Choose route" })
      ).not.toHaveAccessibleErrorMessage()

      await userEvent.click(
        screen.getByRole("button", { name: "Start drawing detour" })
      )

      expect(
        screen.getByRole("combobox", { name: "Choose route" })
      ).toHaveAccessibleErrorMessage("Select a route to continue.")
    })

    test("while on this panel, route is not interactive", async () => {
      const route = routeFactory.build()
      const routePattern = routePatternFactory.build({
        routeId: route.id,
      })

      jest.mocked(fetchRoutePatterns).mockResolvedValue([routePattern])

      const { container } = render(
        <RoutesProvider routes={[route]}>
          <DiversionPage originalRoute={{ route, routePattern }} />
        </RoutesProvider>
      )

      await userEvent.click(
        screen.getByRole("button", { name: "Change route or direction" })
      )

      // Non-Interactive route shape
      expect(
        container.querySelectorAll(".c-detour_map--original-route-shape-core")
      ).toHaveLength(1)

      // Interactive route shape
      expect(
        container.querySelectorAll(".c-detour_map--original-route-shape")
      ).toHaveLength(0)
    })
  })
})
