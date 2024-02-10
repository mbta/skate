import { jest, describe, test, expect } from "@jest/globals"
import React from "react"
import { render } from "@testing-library/react"
import TopNav from "../../../src/components/nav/topNav"
import userEvent from "@testing-library/user-event"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"
import { initialState } from "../../../src/state"
import { BrowserRouter } from "react-router-dom"
import "@testing-library/jest-dom/jest-globals"
import * as browser from "../../../src/models/browser"

describe("TopNav", () => {
  test("refresh button reloads the page", async () => {
    const reloadSpy = jest
      .spyOn(browser, "reload")
      .mockImplementationOnce(() => ({}))

    const dispatch = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <BrowserRouter>
          <TopNav />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await user.click(result.getByTitle("Refresh"))

    expect(reloadSpy).toHaveBeenCalled()
  })

  describe("User info", () => {
    test("has a 'User Info' button", () => {
      const dispatch = jest.fn()
      const result = render(
        <StateDispatchProvider state={initialState} dispatch={dispatch}>
          <BrowserRouter>
            <TopNav />
          </BrowserRouter>
        </StateDispatchProvider>
      )

      expect(
        result.queryByRole("button", { name: "User Info" })
      ).toBeInTheDocument()
    })

    test("brings up an element with 'logged in as' text when clicked", async () => {
      const dispatch = jest.fn()
      const user = userEvent.setup()
      const result = render(
        <StateDispatchProvider state={initialState} dispatch={dispatch}>
          <BrowserRouter>
            <TopNav />
          </BrowserRouter>
        </StateDispatchProvider>
      )

      expect(result.queryByText("Logged in as")).not.toBeInTheDocument()

      await user.click(result.getByTitle("User Info"))

      expect(result.queryByText("Logged in as")).toBeInTheDocument()
    })

    test("clicking the 'User Info' button again makes the 'Logged in as' popover disappear", async () => {
      const dispatch = jest.fn()
      const user = userEvent.setup()
      const result = render(
        <StateDispatchProvider state={initialState} dispatch={dispatch}>
          <BrowserRouter>
            <TopNav />
          </BrowserRouter>
        </StateDispatchProvider>
      )

      await user.click(result.getByTitle("User Info"))
      await user.click(result.getByTitle("User Info"))

      expect(result.queryByText("Logged in as")).not.toBeInTheDocument()
    })
  })
})
