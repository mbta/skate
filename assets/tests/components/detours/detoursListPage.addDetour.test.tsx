import { beforeEach, describe, expect, jest, test } from "@jest/globals"

import React from "react"

import { screen, waitFor } from "@testing-library/dom"
import "@testing-library/jest-dom/jest-globals"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { DetourListPage } from "../../../src/components/detourListPage"
import { TestGroups } from "../../../src/userInTestGroup"
import getTestGroups from "../../../src/userTestGroups"
import { neverPromise } from "../../testHelpers/mockHelpers"
import { fetchDetour, fetchDetours } from "../../../src/api"

jest.mock("../../../src/userTestGroups")

jest.mock("../../../src/api")

beforeEach(() => {
  jest.mocked(fetchDetours).mockReturnValue(neverPromise())
  jest.mocked(fetchDetour).mockReturnValue(neverPromise())
})

const renderDetourListPage = () => {
  return render(<DetourListPage></DetourListPage>)
}

describe("Detours Page: Create Detour", () => {
  test("Shows the add detour button when in test group", async () => {
    jest.mocked(getTestGroups).mockReturnValue([TestGroups.DetoursPilot])

    renderDetourListPage()

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add detour" })).toBeVisible()
    })
  })

  test("Does not show add detour button when not in test group", async () => {
    jest.mocked(getTestGroups).mockReturnValue([])

    renderDetourListPage()

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Add detour" })
      ).not.toBeInTheDocument()
    })
  })

  test("Opens Detour Modal when clicked", async () => {
    jest.mocked(getTestGroups).mockReturnValue([TestGroups.DetoursPilot])

    renderDetourListPage()

    await userEvent.click(screen.getByRole("button", { name: "Add detour" }))

    expect(
      await screen.findByRole("heading", { name: "Create Detour" })
    ).toBeVisible()
  })

  test("Returns to page when modal is closed", async () => {
    jest.mocked(getTestGroups).mockReturnValue([TestGroups.DetoursPilot])

    renderDetourListPage()

    await userEvent.click(screen.getByRole("button", { name: "Add detour" }))

    const createDetourHeading = await screen.findByRole("heading", {
      name: "Create Detour",
    })
    expect(createDetourHeading).toBeVisible()

    await userEvent.click(screen.getByRole("button", { name: "Close" }))

    expect(createDetourHeading).not.toBeInTheDocument()
  })
})
