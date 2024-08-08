import { describe, expect, jest, test } from "@jest/globals"

import React from "react"

import { screen } from "@testing-library/dom"
import "@testing-library/jest-dom/jest-globals"
import { render } from "@testing-library/react"

import { DetourListPage } from "../../../src/components/detourListPage"
import { TestGroups } from "../../../src/userInTestGroup"
import getTestGroups from "../../../src/userTestGroups"

jest.mock("../../../src/userTestGroups")

const renderDetourListPage = () => {
  return render(<DetourListPage></DetourListPage>)
}

describe("Detours Page: Create Detour", () => {
  test("Shows the add detour button when in test group", () => {
    jest.mocked(getTestGroups).mockReturnValue([TestGroups.DetoursPilot])

    renderDetourListPage()

    expect(screen.getByRole("button", { name: "Add detour" })).toBeVisible()
  })

  test("Does not show add detour button when not in test group", () => {
    jest.mocked(getTestGroups).mockReturnValue([])

    renderDetourListPage()

    expect(
      screen.queryByRole("button", { name: "Add detour" })
    ).not.toBeInTheDocument()
  })
})
