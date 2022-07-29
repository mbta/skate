import React from "react"
import { render } from "@testing-library/react"
import BottomNavMobile from "../../../src/components/nav/bottomNavMobile"
import userEvent from "@testing-library/user-event"
import { initialState } from "../../../src/state"
import { BrowserRouter } from "react-router-dom"
import { tagManagerEvent } from "../../../src/helpers/googleTagManager"

jest.mock("../../../src/helpers/googleTagManager", () => ({
  __esModule: true,
  tagManagerEvent: jest.fn(),
}))

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
})
