import { describe, test, expect, jest, beforeEach } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import React from "react"
import { DetourListPage } from "../../../src/components/detourListPage"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import getTestGroups from "../../../src/userTestGroups"
import { TestGroups } from "../../../src/userInTestGroup"
import { byRole } from "testing-library-selector"
import {
  activeDetourDataFactory,
  simpleDetourFactory,
} from "../../factories/detourListFactory"
import {
  useActiveDetours,
  useDraftDetours,
  usePastDetours,
} from "../../../src/hooks/useDetours"
import { simpleDetourFromActivatedData } from "../../../src/models/detoursList"

jest.useFakeTimers().setSystemTime(new Date("2024-08-29T20:00:00"))

jest.mock("../../../src/hooks/useDetours")
jest.mock("../../../src/userTestGroups")

beforeEach(() => {
  jest.mocked(useActiveDetours).mockReturnValue([
    simpleDetourFromActivatedData(activeDetourDataFactory.build()),
    simpleDetourFromActivatedData(
      activeDetourDataFactory.build({
        details: { name: "Headsign A", direction: "Outbound" },
      })
    ),
  ])
  jest.mocked(useDraftDetours).mockReturnValue([])
  jest
    .mocked(usePastDetours)
    .mockReturnValue([simpleDetourFactory.build({ name: "Headsign Z" })])

  jest.mocked(getTestGroups).mockReturnValue([TestGroups.DetoursPilot])
})

const activeTableHeading = byRole("heading", { name: "Active detours" })
const draftTableHeading = byRole("heading", { name: "Draft detours" })
const closedTableHeading = byRole("heading", { name: "Closed detours" })

const addDetourButton = byRole("button", { name: "Add detour" })

const filterIntersectionInput = byRole("textbox", {
  name: "Starting intersection",
})

describe("DetourListPage", () => {
  test("renders detour list page for dispatchers", async () => {
    const { baseElement } = render(<DetourListPage />)

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

  test("orders active detour list by activatedAt value", async () => {
    jest.mocked(getTestGroups).mockReturnValue([TestGroups.DetoursList])

    jest.mocked(useActiveDetours).mockReturnValue({
      "8": simpleDetourFactory.build({
        // Drafted third
        id: 8,
        // Updated second
        updatedAt: 1724876500,
        // Activated second
        activatedAt: new Date(1724766392000),
      }),
      "7": simpleDetourFactory.build({
        // Drafted second
        id: 7,
        // Updated third
        updatedAt: 1724876600,
        // Activated first
        activatedAt: new Date(1724656392000),
      }),
      "1": simpleDetourFactory.build({
        // Drafted first
        id: 1,
        // Updated first
        updatedAt: 1724876400,
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

    render(<DetourListPage />)

    // Ensure all detours are initially visible
    await screen.findByText("Detour 1")
    await screen.findByText("Detour 2")
    await screen.findByText("Detour 3")

    // Filter by "Main St"
    fireEvent.change(filterIntersectionInput.get(), {
      target: { value: "Main St" },
    })

    // Wait for debounce delay
    await waitFor(() => {
      // Verify only matching detours are visible
      expect(screen.queryByText("Detour 1")).toBeVisible()
      expect(screen.queryByText("Detour 3")).toBeVisible()
      expect(screen.queryByText("Detour 2")).not.toBeInTheDocument()
    })
  })
})
