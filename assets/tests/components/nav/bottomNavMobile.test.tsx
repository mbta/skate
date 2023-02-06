import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import BottomNavMobile from "../../../src/components/nav/bottomNavMobile"
import userEvent from "@testing-library/user-event"
import { initialState } from "../../../src/state"
import { BrowserRouter } from "react-router-dom"
import { tagManagerEvent } from "../../../src/helpers/googleTagManager"
import getTestGroups from "../../../src/userTestGroups"
import { MAP_BETA_GROUP_NAME } from "../../../src/userInTestGroup"
import { mockFullStoryEvent } from "../../testHelpers/mockHelpers"
jest.mock("../../../src/helpers/googleTagManager", () => ({
  __esModule: true,
  tagManagerEvent: jest.fn(),
}))

jest.mock("userTestGroups", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}))

describe("BottomNavMobile", () => {
  test("clicking swings view button toggles swing view", async () => {
    mockFullStoryEvent()
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
    expect(window.FS!.event).toHaveBeenCalledWith("User opened Swings View")
  })

  test("renders nav item with title 'Search Map' if in map test group", () => {
    ;(getTestGroups as jest.Mock).mockReturnValue([MAP_BETA_GROUP_NAME])

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
})
