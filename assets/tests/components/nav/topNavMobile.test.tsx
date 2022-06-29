import React from "react"
import { render } from "@testing-library/react"
import TopNavMobile from "../../../src/components/nav/topNavMobile"
import {
  toTitleCase,
  pageOrTabName,
} from "../../../src/components/nav/topNavMobile"
import userEvent from "@testing-library/user-event"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"
import {
  initialState,
  toggleNotificationDrawer,
  toggleMobileMenu,
} from "../../../src/state"
import { BrowserRouter } from "react-router-dom"
import "@testing-library/jest-dom"
import * as browser from "../../../src/models/browser"
import { openDrift } from "../../../src/helpers/drift"
import { displayHelp } from "../../../src/helpers/appCue"

jest.mock("../../../src/helpers/drift", () => ({
  __esModule: true,
  openDrift: jest.fn(),
}))

jest.mock("../../../src/helpers/appCue", () => ({
  __esModule: true,
  displayHelp: jest.fn(),
}))

describe("TopNavMobile", () => {
  test("clicking the menu hamburger button toggles the mobile menu expanded/collapsed state", async () => {
    const dispatch = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <BrowserRouter>
          <TopNavMobile />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await user.click(result.getByTitle("Menu"))

    expect(dispatch).toHaveBeenCalledWith(toggleMobileMenu())
  })

  test("clicking the overlay expanded/collapsed state", async () => {
    const dispatch = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <BrowserRouter>
          <TopNavMobile />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await user.click(result.getByTestId("mobile-overlay"))

    expect(dispatch).toHaveBeenCalledWith(toggleMobileMenu())
  })

  test("mobile menu is visible", () => {
    const dispatch = jest.fn()
    const result = render(
      <StateDispatchProvider
        state={{ ...initialState, mobileMenuIsOpen: true }}
        dispatch={dispatch}
      >
        <BrowserRouter>
          <TopNavMobile />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(result.getByTestId("top-nav-mobile").children[0]).toHaveClass(
      "m-top-nav-mobile__menu--open"
    )
  })

  test("mobile menu is not visible", () => {
    const dispatch = jest.fn()
    const result = render(
      <StateDispatchProvider
        state={{ ...initialState, mobileMenuIsOpen: false }}
        dispatch={dispatch}
      >
        <BrowserRouter>
          <TopNavMobile />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(result.getByTestId("top-nav-mobile").children[0]).not.toHaveClass(
      "m-top-nav-mobile__menu--open"
    )
  })

  test("clicking notifications icon toggles notifications drawer", async () => {
    const dispatch = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <BrowserRouter>
          <TopNavMobile />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await user.click(result.getByTitle("Notifications"))

    expect(dispatch).toHaveBeenCalledWith(toggleNotificationDrawer())
  })

  test("notifications icon gets active class when notifications drawer is open", () => {
    const dispatch = jest.fn()
    const result = render(
      <StateDispatchProvider
        state={{ ...initialState, notificationDrawerIsOpen: true }}
        dispatch={dispatch}
      >
        <BrowserRouter>
          <TopNavMobile />
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
          <TopNavMobile />
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
          <TopNavMobile />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await user.click(result.getByTitle("Refresh"))

    expect(reloadSpy).toHaveBeenCalled()
  })

  test("clicking Support button opens Drift", async () => {
    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <TopNavMobile />
      </BrowserRouter>
    )

    await user.click(result.getByTitle("Support"))

    expect(openDrift).toHaveBeenCalled()
  })

  test("clicking the Support button closes the mobile menu", async () => {
    const dispatch = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <BrowserRouter>
          <TopNavMobile />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await user.click(result.getByTitle("Support"))

    expect(dispatch).toHaveBeenCalledWith(toggleMobileMenu())
  })

  test("clicking the settings button closes the mobile menu", async () => {
    const dispatch = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <BrowserRouter>
          <TopNavMobile />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await user.click(result.getByTitle("Settings"))

    expect(dispatch).toHaveBeenCalledWith(toggleMobileMenu())
  })

  test("clicking About Skate button displays help", async () => {
    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <TopNavMobile />
      </BrowserRouter>
    )

    await user.click(result.getByTitle("About Skate"))

    expect(displayHelp).toHaveBeenCalled()
  })

  test("clicking the About button closes the mobile menu", async () => {
    const dispatch = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <BrowserRouter>
          <TopNavMobile />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await user.click(result.getByTitle("About Skate"))

    expect(dispatch).toHaveBeenCalledWith(toggleMobileMenu())
  })

  test("clicking the logo closes the mobile menu", async () => {
    const dispatch = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <BrowserRouter>
          <TopNavMobile />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await user.click(result.getByTitle("Skate"))

    expect(dispatch).toHaveBeenCalledWith(toggleMobileMenu())
  })

  test("clicking the close button closes the mobile menu", async () => {
    const dispatch = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <BrowserRouter>
          <TopNavMobile />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await user.click(result.getByTitle("Close"))

    expect(dispatch).toHaveBeenCalledWith(toggleMobileMenu())
  })
})

describe("toTitleCase", () => {
  test("capitalizes first letter of each word in string", () => {
    const pageName = "shuttle map"
    expect(toTitleCase(pageName)).toEqual("Shuttle Map")
  })
})

describe("pageOrTabName", () => {
  test("returns Untitled for route ladder page without tabs", () => {
    expect(pageOrTabName("/", [])).toEqual("Untitled")
  })

  test("returns page name for shuttle map", () => {
    expect(pageOrTabName("/shuttle-map", [])).toEqual("Shuttle Map")
  })
})
