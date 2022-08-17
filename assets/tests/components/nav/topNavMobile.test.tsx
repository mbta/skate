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
import { tagManagerEvent } from "../../../src/helpers/googleTagManager"

jest.mock("../../../src/helpers/googleTagManager", () => ({
  __esModule: true,
  tagManagerEvent: jest.fn(),
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

  test("clicking notifications icon toggles notifications drawer and logs a tag manager event", async () => {
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
    expect(tagManagerEvent).toHaveBeenCalledWith("notifications_opened")
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
