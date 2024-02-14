import { jest, describe, test, expect } from "@jest/globals"
import React from "react"
import { render, screen } from "@testing-library/react"
import TopNav from "../../../src/components/nav/topNav"
import userEvent from "@testing-library/user-event"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"
import { initialState } from "../../../src/state"
import { BrowserRouter } from "react-router-dom"
import "@testing-library/jest-dom/jest-globals"
import * as browser from "../../../src/models/browser"
import getTestGroups from "../../../src/userTestGroups"
import { TestGroups } from "../../../src/userInTestGroup"

jest.mock("userTestGroups", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}))

describe("TopNav", () => {
  test("refresh button reloads the page", async () => {
    const reloadSpy = jest
      .spyOn(browser, "reload")
      .mockImplementationOnce(() => ({}))

    const dispatch = jest.fn()
    const user = userEvent.setup()
    render(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <BrowserRouter>
          <TopNav />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await user.click(screen.getByTitle("Refresh"))

    expect(reloadSpy).toHaveBeenCalled()
  })

  describe("User info", () => {
    test("does not have a 'User Info' button if the user isn't in the right test group", () => {
      jest.mocked(getTestGroups).mockReturnValue([])

      const dispatch = jest.fn()
      render(
        <StateDispatchProvider state={initialState} dispatch={dispatch}>
          <BrowserRouter>
            <TopNav />
          </BrowserRouter>
        </StateDispatchProvider>
      )

      expect(
        screen.queryByRole("button", { name: "User Info" })
      ).not.toBeInTheDocument()
    })

    test("has a 'User Info' button", () => {
      jest.mocked(getTestGroups).mockReturnValue([TestGroups.KeycloakSso])

      const dispatch = jest.fn()
      render(
        <StateDispatchProvider state={initialState} dispatch={dispatch}>
          <BrowserRouter>
            <TopNav />
          </BrowserRouter>
        </StateDispatchProvider>
      )

      expect(
        screen.queryByRole("button", { name: "User Info" })
      ).toBeInTheDocument()
    })

    test("brings up an element with 'logged in as' text and a logout ling when clicked", async () => {
      jest.mocked(getTestGroups).mockReturnValue([TestGroups.KeycloakSso])

      const dispatch = jest.fn()
      const user = userEvent.setup()
      render(
        <StateDispatchProvider state={initialState} dispatch={dispatch}>
          <BrowserRouter>
            <TopNav />
          </BrowserRouter>
        </StateDispatchProvider>
      )

      expect(screen.queryByText("Logged in as")).not.toBeInTheDocument()

      await user.click(screen.getByTitle("User Info"))

      expect(screen.queryByText("Logged in as")).toBeInTheDocument()

      const logoutLink = screen.queryByRole("link", { name: "Log out" })

      expect(logoutLink).toBeVisible()

      expect(logoutLink?.attributes.getNamedItem("href")?.value).toBe(
        "/auth/keycloak/logout"
      )
    })

    test("clicking the 'User Info' button again makes the 'Logged in as' popover disappear", async () => {
      jest.mocked(getTestGroups).mockReturnValue([TestGroups.KeycloakSso])

      const dispatch = jest.fn()
      const user = userEvent.setup()
      render(
        <StateDispatchProvider state={initialState} dispatch={dispatch}>
          <BrowserRouter>
            <TopNav />
          </BrowserRouter>
        </StateDispatchProvider>
      )

      await user.click(screen.getByTitle("User Info"))
      await user.click(screen.getByTitle("User Info"))

      expect(screen.queryByText("Logged in as")).not.toBeInTheDocument()
    })
  })
})
