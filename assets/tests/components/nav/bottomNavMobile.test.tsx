import React from "react"
import { render } from "@testing-library/react"
import "@testing-library/jest-dom"
import BottomNavMobile from "../../../src/components/nav/bottomNavMobile"
import userEvent from "@testing-library/user-event"
import { initialState } from "../../../src/state"
import { BrowserRouter } from "react-router-dom"
import { tagManagerEvent } from "../../../src/helpers/googleTagManager"
import appData from "../../../src/appData"
import { MAP_BETA_GROUP_NAME } from "../../../src/userTestGroups"

jest.mock("../../../src/helpers/googleTagManager", () => ({
  __esModule: true,
  tagManagerEvent: jest.fn(),
}))

jest.mock("appData")

describe("BottomNavMobile", () => {
  test("clicking swings view button toggles swing view", async () => {
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
  })

  test("renders nav item with title 'Map' if in map test group", () => {
    ;(appData as jest.Mock).mockImplementationOnce(() => ({
      userTestGroups: JSON.stringify([MAP_BETA_GROUP_NAME]),
    }))

    const result = render(
      <BrowserRouter>
        <BottomNavMobile
          mobileMenuIsOpen={initialState.mobileMenuIsOpen}
          openSwingsView={jest.fn()}
        />
      </BrowserRouter>
    )

    expect(result.queryByTitle("Search")).toBeNull()
    expect(result.queryByTitle("Map")).toBeInTheDocument()
  })
})
