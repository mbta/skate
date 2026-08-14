import { describe, test, expect, jest, beforeEach } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import React from "react"
import { DetourListPage } from "../../../src/components/detourListPage"
import { buildPaginationItems } from "../../../src/models/detoursPaginationData"
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import getTestGroups from "../../../src/userTestGroups"
import { TestGroups } from "../../../src/userInTestGroup"
import { byRole } from "testing-library-selector"
import {
  simpleActiveDetourFactory,
  simpleDetourFactory,
} from "../../factories/detourListFactory"
import {
  useActiveDetours,
  useDraftDetours,
  usePastDetours,
} from "../../../src/hooks/useDetours"
import { fullStoryEvent } from "../../../src/helpers/fullStory"
import { RoutesProvider } from "../../../src/contexts/routesContext"
import routeFactory from "../../factories/route"

jest.useFakeTimers().setSystemTime(new Date("2024-08-29T20:00:00"))

jest.mock("../../../src/hooks/useDetours")
jest.mock("../../../src/userTestGroups")
jest.mock("../../../src/helpers/fullStory")

const activeTableHeading = byRole("heading", { name: "Active detours" })
const draftTableHeading = byRole("heading", { name: "Draft detours" })
const closedTableHeading = byRole("heading", { name: "Closed detours" })

const addDetourButton = byRole("button", { name: "Add detour" })

const filterIntersectionInput = byRole("textbox", {
  name: "Starting intersection",
})

describe("buildPaginationItems", () => {
  test("returns all pages when the total page count is small", () => {
    const currentPage = 3
    const totalPages = 7

    const actual = buildPaginationItems(currentPage, totalPages)

    const expected = [1, 2, 3, 4, 5, 6, 7]
    expect(actual).toStrictEqual(expected)
  })

  test("builds a centered window with ellipses when there are many pages", () => {
    const currentPage = 5
    const totalPages = 10

    const actual = buildPaginationItems(currentPage, totalPages)

    const expected = [1, "ellipsis", 4, 5, 6, "ellipsis", 10]
    expect(actual).toStrictEqual(expected)
  })

  test("builds a window with ellipses when there are many pages", () => {
    const currentPage = 4
    const totalPages = 14

    const actual = buildPaginationItems(currentPage, totalPages)

    const expected = [1, "ellipsis", 3, 4, 5, "ellipsis", 14]
    expect(actual).toStrictEqual(expected)
  })

  test("clamps the current page when it exceeds bounds", () => {
    const currentPage = 99
    const totalPages = 10

    const actual = buildPaginationItems(currentPage, totalPages)

    const expected = [1, "ellipsis", 9, 10]
    expect(actual).toStrictEqual(expected)
  })
})

describe("DetourListPage", () => {
  beforeEach(() => {
    jest.mocked(useActiveDetours).mockReturnValue([
      simpleActiveDetourFactory.build(),
      simpleActiveDetourFactory.build({
        name: "Headsign A",
        direction: "Outbound",
      }),
    ])
    jest.mocked(useDraftDetours).mockReturnValue([])
    jest
      .mocked(usePastDetours)
      .mockReturnValue([simpleDetourFactory.build({ name: "Headsign Z" })])

    jest.mocked(getTestGroups).mockReturnValue([TestGroups.DetoursPilot])
  })

  test("renders detour list page for dispatchers", async () => {
    const routes = routeFactory.buildList(2)
    const { baseElement } = render(
      <RoutesProvider routes={routes}>
        <DetourListPage />
      </RoutesProvider>
    )

    await screen.findByText("Headsign Z")

    expect(activeTableHeading.get()).toBeVisible()
    expect(draftTableHeading.get()).toBeVisible()
    expect(closedTableHeading.get()).toBeVisible()

    expect(addDetourButton.get()).toBeVisible()

    expect(filterIntersectionInput.get()).toBeVisible()

    expect(baseElement).toMatchSnapshot()
  })

  test("renders limited detour list page for non-dispatchers", async () => {
    jest.mocked(getTestGroups).mockReturnValue([TestGroups.DetoursList])

    const { baseElement } = render(<DetourListPage />)

    await screen.findByText("Headsign A")

    expect(screen.queryByText("Headsign Z")).not.toBeInTheDocument()

    expect(activeTableHeading.get()).toBeVisible()
    expect(draftTableHeading.query()).not.toBeInTheDocument()
    expect(closedTableHeading.query()).not.toBeInTheDocument()

    expect(addDetourButton.query()).not.toBeInTheDocument()
    expect(filterIntersectionInput.query()).not.toBeInTheDocument()

    expect(baseElement).toMatchSnapshot()
  })

  test("renders empty tables when needed", async () => {
    render(<DetourListPage />)

    await waitFor(() =>
      expect(screen.queryByText("No draft detours.")).toBeVisible()
    )
    expect(screen.queryByText("No active detours.")).not.toBeInTheDocument()
    expect(screen.queryByText("No closed detours.")).not.toBeInTheDocument()
  })

  test("orders active detour list by updatedAt value", async () => {
    jest.mocked(getTestGroups).mockReturnValue([TestGroups.DetoursList])

    jest.mocked(useActiveDetours).mockReturnValue({
      "8": simpleDetourFactory.build({
        // Drafted third
        id: 8,
        // Updated second
        updatedAt: 1724816500,
        // Activated second
        activatedAt: new Date(1724766392000),
      }),
      "7": simpleDetourFactory.build({
        // Drafted second
        id: 7,
        // Updated third
        updatedAt: 1724856600,
        // Activated first
        activatedAt: new Date(1724656392000),
      }),
      "1": simpleDetourFactory.build({
        // Drafted first
        id: 1,
        // Updated first
        updatedAt: 1724896400,
        // Activated third
        activatedAt: new Date(1724876392000),
      }),
    })
    jest.mocked(useDraftDetours).mockReturnValue({})
    jest.mocked(usePastDetours).mockReturnValue({})

    const { baseElement } = render(<DetourListPage />)

    await screen.findAllByText(/Headsign/)

    expect(baseElement).toMatchSnapshot()
  })

  test("filters detours by intersection input", async () => {
    const routes = routeFactory.buildList(2)
    const mockedFSEvent = jest.mocked(fullStoryEvent)
    jest.mocked(useDraftDetours).mockReturnValue({})
    jest.mocked(useActiveDetours).mockReturnValue({})
    jest.mocked(usePastDetours).mockReturnValue([
      simpleDetourFactory.build({
        id: 1,
        intersection: "Main St & 1st Ave",
        name: "Detour 1",
      }),
      simpleDetourFactory.build({
        id: 2,
        intersection: "Broadway & 2nd Ave",
        name: "Detour 2",
      }),
      simpleDetourFactory.build({
        id: 3,
        intersection: "Main St & 3rd Ave",
        name: "Detour 3",
      }),
    ])

    render(
      <RoutesProvider routes={routes}>
        <DetourListPage />
      </RoutesProvider>
    )

    // Ensure all detours are initially visible
    await screen.findByText("Detour 1")
    await screen.findByText("Detour 2")
    await screen.findByText("Detour 3")

    // Filter by "Main St"
    fireEvent.change(filterIntersectionInput.get(), {
      target: { value: "Main St" },
    })

    // Mimic user clicking somewhere else after typing
    fireEvent.blur(filterIntersectionInput.get())

    // Wait for debounce delay
    await waitFor(() => {
      // Verify only matching detours are visible
      expect(screen.queryByText("Detour 1")).toBeVisible()
      expect(screen.queryByText("Detour 3")).toBeVisible()
      expect(screen.queryByText("Detour 2")).not.toBeInTheDocument()
      expect(mockedFSEvent).toHaveBeenCalledWith(
        "Detour Intersection Filter Used",
        {}
      )
    })
  })

  test("disables previous on first page and toggles next on last page", async () => {
    jest.mocked(usePastDetours).mockImplementation((args) => {
      const { onPaginate, pageNumber } = args

      React.useEffect(() => {
        onPaginate?.({
          totalCount: 2,
          totalPages: 2,
          pageNumber,
          pageSize: 1,
        })
      }, [onPaginate, pageNumber])

      return [simpleDetourFactory.build({ id: pageNumber, name: "Closed" })]
    })

    render(<DetourListPage />)

    const previousButton = screen.getByLabelText("Previous")
    const nextButton = screen.getByLabelText("Next")

    await waitFor(() => {
      expect(previousButton).toHaveAttribute("aria-disabled", "true")
      expect(nextButton).not.toHaveAttribute("aria-disabled", "true")
    })

    await act(async () => {
      fireEvent.click(nextButton)
    })

    await waitFor(() => {
      const pagination = screen.getByLabelText("Previous").closest("ul")
      expect(pagination).not.toBeNull()
      expect(within(pagination!).getByText("2").closest("li")).toHaveClass(
        "active"
      )
      expect(screen.getByLabelText("Previous")).not.toHaveAttribute(
        "aria-disabled",
        "true"
      )
      expect(screen.getByLabelText("Next")).toHaveAttribute(
        "aria-disabled",
        "true"
      )
    })
  })

  test("resets page number to 1 when the selected route changes", async () => {
    const routes = routeFactory.buildList(2)

    jest.mocked(usePastDetours).mockImplementation((args) => {
      return [
        simpleDetourFactory.build({
          id: args.pageNumber,
          name: `Closed ${args.routeId}`,
        }),
      ]
    })

    render(
      <RoutesProvider routes={routes}>
        <DetourListPage />
      </RoutesProvider>
    )

    fireEvent.click(screen.getByLabelText("Next"))

    await waitFor(() => {
      const pagination = screen.getByLabelText("Previous").closest("ul")
      expect(pagination).not.toBeNull()
      expect(within(pagination!).getByText("2").closest("li")).toHaveClass(
        "active"
      )
    })

    fireEvent.change(screen.getByLabelText("Route and direction"), {
      target: { value: routes[0].id },
    })

    await waitFor(() => {
      const pagination = screen.getByLabelText("Previous").closest("ul")
      expect(pagination).not.toBeNull()
      expect(within(pagination!).getByText("1").closest("li")).toHaveClass(
        "active"
      )
      expect(screen.getByLabelText("Previous")).toHaveAttribute(
        "aria-disabled",
        "true"
      )
      expect(jest.mocked(usePastDetours)).toHaveBeenLastCalledWith(
        expect.objectContaining({
          routeId: routes[0].id,
          pageNumber: 1,
        })
      )
    })
  })

  test("passes filter to usePastDetours", async () => {
    const routes = routeFactory.buildList(2)
    jest.mocked(usePastDetours).mockReturnValue([])

    render(
      <RoutesProvider routes={routes}>
        <DetourListPage />
      </RoutesProvider>
    )

    await waitFor(() => {
      expect(jest.mocked(usePastDetours)).toHaveBeenCalledWith(
        expect.objectContaining({
          detoursFilter: {},
        })
      )
    })
  })

  test("resets page number to 1 when filter changes", async () => {
    const routes = routeFactory.buildList(2)

    jest.mocked(usePastDetours).mockImplementation((args) => {
      return [
        simpleDetourFactory.build({
          id: args.pageNumber,
          name: `Closed ${args.detoursFilter?.intersection || "all"}`,
        }),
      ]
    })

    render(
      <RoutesProvider routes={routes}>
        <DetourListPage />
      </RoutesProvider>
    )

    // Navigate to page 2
    fireEvent.click(screen.getByLabelText("Next"))

    await waitFor(() => {
      const pagination = screen.getByLabelText("Previous").closest("ul")
      expect(pagination).not.toBeNull()
      expect(within(pagination!).getByText("2").closest("li")).toHaveClass(
        "active"
      )
    })

    // Change filter - should reset to page 1
    fireEvent.change(filterIntersectionInput.get(), {
      target: { value: "Main St" },
    })

    await waitFor(() => {
      const pagination = screen.getByLabelText("Previous").closest("ul")
      expect(pagination).not.toBeNull()
      expect(within(pagination!).getByText("1").closest("li")).toHaveClass(
        "active"
      )
      expect(screen.getByLabelText("Previous")).toHaveAttribute(
        "aria-disabled",
        "true"
      )
    })
  })
})
