import { describe, test, expect, jest, beforeEach } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import React from "react"
import { DetourListPage } from "../../../src/components/detourListPage"
import { fetchDetours } from "../../../src/api"
import { neverPromise } from "../../testHelpers/mockHelpers"
import { Ok } from "../../../src/util/result"
import { render, screen, waitFor } from "@testing-library/react"
import getTestGroups from "../../../src/userTestGroups"
import { TestGroups } from "../../../src/userInTestGroup"
import { byRole } from "testing-library-selector"

jest.useFakeTimers().setSystemTime(new Date("2024-08-29T20:00:00"))

jest.mock("../../../src/api")
jest.mock("../../../src/userTestGroups")

beforeEach(() => {
  jest.mocked(fetchDetours).mockReturnValue(neverPromise())

  jest
    .mocked(getTestGroups)
    .mockReturnValue([TestGroups.DetoursPilot, TestGroups.DetoursList])
})

const activeTableHeading = byRole("heading", { name: "Active detours" })
const draftTableHeading = byRole("heading", { name: "Draft detours" })
const closedTableHeading = byRole("heading", { name: "Closed detours" })

const addDetourButton = byRole("button", { name: "Add detour" })

describe("DetourListPage", () => {
  test("renders detour list page for dispatchers", async () => {
    jest.mocked(fetchDetours).mockResolvedValue(
      Ok({
        active: [
          {
            id: 1,
            route: "1",
            viaVariant: "X",
            direction: "Inbound",
            name: "Headsign A",
            intersection: "Street A & Avenue B",
            updatedAt: 1724866392,
            activatedAt: new Date(1724866392000),
            estimatedDuration: "2 hours",
          },
          {
            id: 8,
            route: "2",
            viaVariant: "Y",
            direction: "Outbound",
            name: "Headsign B",
            intersection: "Street C & Avenue D",
            updatedAt: 1724856392,
            activatedAt: new Date(1724856392000),
            estimatedDuration: "3 hours",
          },
        ],
        draft: [],
        past: [
          {
            id: 10,
            route: "1",
            viaVariant: "X",
            direction: "Inbound",
            name: "Headsign A",
            intersection: "Street E & Avenue F",
            updatedAt: 1724866392,
          },
          {
            id: 7,
            route: "1",
            viaVariant: "Z",
            direction: "Outbound",
            name: "Headsign Z",
            intersection: "Street C & Avenue D",
            updatedAt: 1724866392,
          },
        ],
      })
    )

    const { baseElement } = render(<DetourListPage />)

    await screen.findByText("Headsign Z")

    expect(activeTableHeading.get()).toBeVisible()
    expect(draftTableHeading.get()).toBeVisible()
    expect(closedTableHeading.get()).toBeVisible()

    expect(addDetourButton.get()).toBeVisible()

    expect(baseElement).toMatchSnapshot()
  })

  test("renders limited detour list page for non-dispatchers", async () => {
    jest.mocked(getTestGroups).mockReturnValue([TestGroups.DetoursList])

    jest.mocked(fetchDetours).mockResolvedValue(
      Ok({
        active: [
          {
            id: 1,
            route: "1",
            viaVariant: "X",
            direction: "Inbound",
            name: "Headsign A",
            intersection: "Street A & Avenue B",
            updatedAt: 1724866392,
            activatedAt: new Date(1724866392000),
            estimatedDuration: "4 hours",
          },
          {
            id: 8,
            route: "2",
            viaVariant: "Y",
            direction: "Outbound",
            name: "Headsign B",
            intersection: "Street C & Avenue D",
            updatedAt: 1724856392,
            activatedAt: new Date(1724856392000),
            estimatedDuration: "Until end of service",
          },
        ],
        draft: [],
        past: [
          {
            id: 10,
            route: "1",
            viaVariant: "X",
            direction: "Inbound",
            name: "Headsign A",
            intersection: "Street E & Avenue F",
            updatedAt: 1724866392,
          },
          {
            id: 7,
            route: "1",
            viaVariant: "Z",
            direction: "Outbound",
            name: "Headsign Z",
            intersection: "Street C & Avenue D",
            updatedAt: 1724866392,
          },
        ],
      })
    )

    const { baseElement } = render(<DetourListPage />)

    await screen.findByText("Headsign B")

    expect(screen.queryByText("Headsign Z")).not.toBeInTheDocument()

    expect(activeTableHeading.get()).toBeVisible()
    expect(draftTableHeading.query()).not.toBeInTheDocument()
    expect(closedTableHeading.query()).not.toBeInTheDocument()

    expect(addDetourButton.query()).not.toBeInTheDocument()

    expect(baseElement).toMatchSnapshot()
  })

  test("renders empty tables when needed", async () => {
    jest.mocked(fetchDetours).mockResolvedValue(
      Ok({
        active: [
          {
            id: 1,
            route: "1",
            viaVariant: "X",
            direction: "Inbound",
            name: "Headsign A",
            intersection: "Street A & Avenue B",
            updatedAt: 1724866392,
            activatedAt: new Date(1724866392000),
            estimatedDuration: "4 hours",
          },
        ],
        draft: [],
        past: [
          {
            id: 10,
            route: "1",
            viaVariant: "X",
            direction: "Inbound",
            name: "Headsign A",
            intersection: "Street E & Avenue F",
            updatedAt: 1724866392,
          },
        ],
      })
    )

    render(<DetourListPage />)

    await waitFor(() =>
      expect(screen.queryByText("No draft detours.")).toBeVisible()
    )
    expect(screen.queryByText("No active detours.")).not.toBeInTheDocument()
    expect(screen.queryByText("No closed detours.")).not.toBeInTheDocument()
  })
})
