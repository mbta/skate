import { jest, describe, test, expect } from "@jest/globals"
import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"
import BottomNavMobile from "../../../src/components/nav/bottomNavMobile"
import userEvent from "@testing-library/user-event"
import { initialState } from "../../../src/state"
import { BrowserRouter } from "react-router-dom"
import { tagManagerEvent } from "../../../src/helpers/googleTagManager"
import getTestGroups from "../../../src/userTestGroups"
import { TestGroups } from "../../../src/userInTestGroup"
import { fullStoryEvent } from "../../../src/helpers/fullStory"

jest.mock("../../../src/helpers/googleTagManager", () => ({
  __esModule: true,
  tagManagerEvent: jest.fn(),
}))

jest.mock("userTestGroups", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}))

jest.mock("../../../src/helpers/fullStory")

describe("BottomNavMobile", () => {
  test("clicking swings view button toggles swing view", async () => {
    const mockedFSEvent = jest.mocked(fullStoryEvent)
    const openSwingsView = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <BottomNavMobile
          mobileMenuIsOpen={initialState.mobileMenuIsOpen}
          openSwingsView={openSwingsView}
        />
      </BrowserRouter>
    )

    await user.click(result.getByTitle("Swings View"))

    expect(openSwingsView).toHaveBeenCalled()
    expect(tagManagerEvent).toHaveBeenCalledWith("swings_view_toggled")
    expect(mockedFSEvent).toHaveBeenCalledWith("User opened Swings View", {})
  })

  test("renders nav item with title 'Search Map' if in map test group", () => {
    jest.mocked(getTestGroups).mockReturnValue([TestGroups.MapBeta])

    render(
      <BrowserRouter>
        <BottomNavMobile
          mobileMenuIsOpen={initialState.mobileMenuIsOpen}
          openSwingsView={jest.fn()}
        />
      </BrowserRouter>
    )

    expect(screen.queryByTitle("Search")).toBeNull()
    expect(screen.queryByTitle("Search Map")).toBeInTheDocument()
  })

  test("does not render nav item with title 'Detours' even if in test group", () => {
    jest.mocked(getTestGroups).mockReturnValue([TestGroups.DummyDetourPage])

    render(
      <BrowserRouter>
        <BottomNavMobile
          mobileMenuIsOpen={initialState.mobileMenuIsOpen}
          openSwingsView={jest.fn()}
        />
      </BrowserRouter>
    )

    expect(screen.queryByTitle("Detours")).toBeNull()
  })
})
