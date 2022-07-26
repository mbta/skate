import React from "react"
import { render } from "@testing-library/react"
import TopNav from "../../../src/components/nav/topNav"
import userEvent from "@testing-library/user-event"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"
import { initialState, openNotificationDrawer } from "../../../src/state"
import { BrowserRouter } from "react-router-dom"
import "@testing-library/jest-dom"
import * as browser from "../../../src/models/browser"

describe("TopNav", () => {
  test("clicking notifications icon toggles notifications drawer", async () => {
    const dispatch = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <BrowserRouter>
          <TopNav />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await user.click(result.getByTitle("Notifications"))

    expect(dispatch).toHaveBeenCalledWith(openNotificationDrawer())
  })

  test("notifications icon gets active class when notifications drawer is open", () => {
    const dispatch = jest.fn()
    const result = render(
      <StateDispatchProvider
        state={{ ...initialState, notificationDrawerIsOpen: true }}
        dispatch={dispatch}
      >
        <BrowserRouter>
          <TopNav />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(result.getByTitle("Notifications").children[0]).toHaveClass(
      "m-top-nav__notifications-icon--active"
    )
  })

  test("notifications icon doesn't get active class when notifications drawer is close", () => {
    const dispatch = jest.fn()
    const result = render(
      <StateDispatchProvider
        state={{ ...initialState, notificationDrawerIsOpen: false }}
        dispatch={dispatch}
      >
        <BrowserRouter>
          <TopNav />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(result.getByTitle("Notifications").children[0]).not.toHaveClass(
      "m-top-nav__notifications-icon--active"
    )
  })

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
})
