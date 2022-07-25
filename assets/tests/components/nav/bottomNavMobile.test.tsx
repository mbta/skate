import React from "react"
import { render } from "@testing-library/react"
import BottomNavMobile from "../../../src/components/nav/bottomNavMobile"
import userEvent from "@testing-library/user-event"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"
import { initialState, openSwingsView } from "../../../src/state"
import { BrowserRouter } from "react-router-dom"
import { tagManagerEvent } from "../../../src/helpers/googleTagManager"

jest.mock("../../../src/helpers/googleTagManager", () => ({
  __esModule: true,
  tagManagerEvent: jest.fn(),
}))

describe("BottomNavMobile", () => {
  test("clicking swings view button toggles swing view", async () => {
    const dispatch = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <BrowserRouter>
          <BottomNavMobile />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await user.click(result.getByTitle("Swings View"))

    expect(dispatch).toHaveBeenCalledWith(openSwingsView())
    expect(tagManagerEvent).toHaveBeenCalledWith("swings_view_toggled")
  })
})
