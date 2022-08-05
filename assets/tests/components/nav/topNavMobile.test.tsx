import React from "react"
import { render } from "@testing-library/react"
import TopNavMobile from "../../../src/components/nav/topNavMobile"
import {
  toTitleCase,
  pageOrTabName,
} from "../../../src/components/nav/topNavMobile"
import userEvent from "@testing-library/user-event"
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
    const toggleMobileMenu = jest.fn()
    const openNotificationDrawer = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <TopNavMobile
          toggleMobileMenu={toggleMobileMenu}
          openNotificationDrawer={openNotificationDrawer}
          routeTabs={[]}
          mobileMenuIsOpen={false}
        />
      </BrowserRouter>
    )

    await user.click(result.getByTitle("Menu"))

    expect(toggleMobileMenu).toHaveBeenCalled()
  })

  test("clicking the overlay expanded/collapsed state", async () => {
    const toggleMobileMenu = jest.fn()
    const openNotificationDrawer = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <TopNavMobile
          toggleMobileMenu={toggleMobileMenu}
          openNotificationDrawer={openNotificationDrawer}
          routeTabs={[]}
          mobileMenuIsOpen={false}
        />
      </BrowserRouter>
    )

    await user.click(result.getByTestId("mobile-overlay"))

    expect(toggleMobileMenu).toHaveBeenCalled()
  })

  test("mobile menu is visible", () => {
    const toggleMobileMenu = jest.fn()
    const openNotificationDrawer = jest.fn()

    const result = render(
      <BrowserRouter>
        <TopNavMobile
          toggleMobileMenu={toggleMobileMenu}
          openNotificationDrawer={openNotificationDrawer}
          routeTabs={[]}
          mobileMenuIsOpen={true}
        />
      </BrowserRouter>
    )

    expect(result.getByTestId("top-nav-mobile").children[0]).toHaveClass(
      "m-top-nav-mobile__menu--open"
    )
  })

  test("mobile menu is not visible", () => {
    const toggleMobileMenu = jest.fn()
    const openNotificationDrawer = jest.fn()

    const result = render(
      <BrowserRouter>
        <TopNavMobile
          toggleMobileMenu={toggleMobileMenu}
          openNotificationDrawer={openNotificationDrawer}
          routeTabs={[]}
          mobileMenuIsOpen={false}
        />
      </BrowserRouter>
    )

    expect(result.getByTestId("top-nav-mobile").children[0]).not.toHaveClass(
      "m-top-nav-mobile__menu--open"
    )
  })

  test("clicking notifications icon toggles notifications drawer", async () => {
    const toggleMobileMenu = jest.fn()
    const openNotificationDrawer = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <TopNavMobile
          toggleMobileMenu={toggleMobileMenu}
          openNotificationDrawer={openNotificationDrawer}
          routeTabs={[]}
          mobileMenuIsOpen={false}
        />
      </BrowserRouter>
    )

    await user.click(result.getByTitle("Notifications"))

    expect(openNotificationDrawer).toHaveBeenCalled()
  })

  test("refresh button reloads the page", async () => {
    const reloadSpy = jest
      .spyOn(browser, "reload")
      .mockImplementationOnce(() => ({}))

    const toggleMobileMenu = jest.fn()
    const openNotificationDrawer = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <TopNavMobile
          toggleMobileMenu={toggleMobileMenu}
          openNotificationDrawer={openNotificationDrawer}
          routeTabs={[]}
          mobileMenuIsOpen={false}
        />
      </BrowserRouter>
    )

    await user.click(result.getByTitle("Refresh"))

    expect(reloadSpy).toHaveBeenCalled()
  })

  test("clicking Support button opens Drift", async () => {
    const toggleMobileMenu = jest.fn()
    const openNotificationDrawer = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <TopNavMobile
          toggleMobileMenu={toggleMobileMenu}
          openNotificationDrawer={openNotificationDrawer}
          routeTabs={[]}
          mobileMenuIsOpen={false}
        />
      </BrowserRouter>
    )

    await user.click(result.getByTitle("Support"))

    expect(openDrift).toHaveBeenCalled()
  })

  test("clicking the Support button closes the mobile menu", async () => {
    const toggleMobileMenu = jest.fn()
    const openNotificationDrawer = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <TopNavMobile
          toggleMobileMenu={toggleMobileMenu}
          openNotificationDrawer={openNotificationDrawer}
          routeTabs={[]}
          mobileMenuIsOpen={false}
        />
      </BrowserRouter>
    )

    await user.click(result.getByTitle("Support"))

    expect(toggleMobileMenu).toHaveBeenCalled()
  })

  test("clicking the settings button closes the mobile menu", async () => {
    const toggleMobileMenu = jest.fn()
    const openNotificationDrawer = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <TopNavMobile
          toggleMobileMenu={toggleMobileMenu}
          openNotificationDrawer={openNotificationDrawer}
          routeTabs={[]}
          mobileMenuIsOpen={true}
        />
      </BrowserRouter>
    )

    await user.click(result.getByTitle("Settings"))

    expect(toggleMobileMenu).toHaveBeenCalled()
  })

  test("clicking About Skate button displays help", async () => {
    const toggleMobileMenu = jest.fn()
    const openNotificationDrawer = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <TopNavMobile
          toggleMobileMenu={toggleMobileMenu}
          openNotificationDrawer={openNotificationDrawer}
          routeTabs={[]}
          mobileMenuIsOpen={false}
        />
      </BrowserRouter>
    )

    await user.click(result.getByTitle("About Skate"))

    expect(displayHelp).toHaveBeenCalled()
  })

  test("clicking the About button closes the mobile menu", async () => {
    const toggleMobileMenu = jest.fn()
    const openNotificationDrawer = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <TopNavMobile
          toggleMobileMenu={toggleMobileMenu}
          openNotificationDrawer={openNotificationDrawer}
          routeTabs={[]}
          mobileMenuIsOpen={true}
        />
      </BrowserRouter>
    )

    await user.click(result.getByTitle("About Skate"))

    expect(toggleMobileMenu).toHaveBeenCalled()
  })

  test("clicking the logo closes the mobile menu", async () => {
    const toggleMobileMenu = jest.fn()
    const openNotificationDrawer = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <TopNavMobile
          toggleMobileMenu={toggleMobileMenu}
          openNotificationDrawer={openNotificationDrawer}
          routeTabs={[]}
          mobileMenuIsOpen={true}
        />
      </BrowserRouter>
    )

    await user.click(result.getByTitle("Skate"))

    expect(toggleMobileMenu).toHaveBeenCalled()
  })

  test("clicking the close button closes the mobile menu", async () => {
    const toggleMobileMenu = jest.fn()
    const openNotificationDrawer = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <TopNavMobile
          toggleMobileMenu={toggleMobileMenu}
          openNotificationDrawer={openNotificationDrawer}
          routeTabs={[]}
          mobileMenuIsOpen={true}
        />
      </BrowserRouter>
    )

    await user.click(result.getByTitle("Close"))

    expect(toggleMobileMenu).toHaveBeenCalled()
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
