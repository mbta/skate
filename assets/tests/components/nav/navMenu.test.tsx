import { jest, describe, test, expect } from "@jest/globals"
import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom/jest-globals"
import * as browser from "../../../src/models/browser"
import { openDrift } from "../../../src/helpers/drift"
import NavMenu from "../../../src/components/nav/navMenu"
import { BrowserRouter } from "react-router-dom"
import getEmailAddress from "../../../src/userEmailAddress"

jest.mock("../../../src/helpers/drift", () => ({
  __esModule: true,
  openDrift: jest.fn(),
}))

jest.mock("../../../src/helpers/appCue", () => ({
  __esModule: true,
  displayHelp: jest.fn(),
}))

jest.mock("userTestGroups", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}))

jest.mock("../../../src/userEmailAddress")

describe("NavMenu", () => {
  test("when mobile menu is open, clicking the backdrop toggled the mobile menu", async () => {
    const toggleMobileMenu = jest.fn()

    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <NavMenu toggleMobileMenu={toggleMobileMenu} mobileMenuIsOpen={true} />
      </BrowserRouter>
    )

    await user.click(screen.getByTestId("nav-menu-backdrop"))

    expect(toggleMobileMenu).toHaveBeenCalled()
  })

  test("when mobile menu is closed, there is no backdrop", async () => {
    const toggleMobileMenu = jest.fn()

    render(
      <BrowserRouter>
        <NavMenu toggleMobileMenu={toggleMobileMenu} mobileMenuIsOpen={false} />
      </BrowserRouter>
    )

    expect(screen.queryByTestId("nav-menu-backdrop")).not.toBeInTheDocument()
  })

  test("mobile menu is visible", () => {
    const toggleMobileMenu = jest.fn()

    const result = render(
      <BrowserRouter>
        <NavMenu toggleMobileMenu={toggleMobileMenu} mobileMenuIsOpen={true} />
      </BrowserRouter>
    )

    expect(result.getByTestId("nav-menu")).toHaveClass("c-nav-menu--open")
  })

  test("mobile menu is not visible", () => {
    const toggleMobileMenu = jest.fn()

    const result = render(
      <BrowserRouter>
        <NavMenu toggleMobileMenu={toggleMobileMenu} mobileMenuIsOpen={false} />
      </BrowserRouter>
    )

    expect(result.getByTestId("nav-menu")).not.toHaveClass("c-nav-menu--open")
  })

  test("shows who is logged in", async () => {
    jest.mocked(getEmailAddress).mockReturnValue("test@example.localhost")

    render(
      <BrowserRouter>
        <NavMenu toggleMobileMenu={jest.fn()} mobileMenuIsOpen={true} />
      </BrowserRouter>
    )

    expect(await screen.findByText("Logged in as")).toBeVisible()
  })

  test("shows logout button", async () => {
    jest.mocked(getEmailAddress).mockReturnValue("test@example.localhost")

    render(
      <BrowserRouter>
        <NavMenu toggleMobileMenu={jest.fn()} mobileMenuIsOpen={true} />
      </BrowserRouter>
    )

    expect(screen.getByRole("link", { name: "Logout" })).toBeVisible()
  })

  test("refresh button reloads the page", async () => {
    const reloadSpy = jest
      .spyOn(browser, "reload")
      .mockImplementationOnce(() => ({}))

    const toggleMobileMenu = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <NavMenu toggleMobileMenu={toggleMobileMenu} mobileMenuIsOpen={true} />
      </BrowserRouter>
    )

    await user.click(result.getByRole("button", { name: "Refresh" }))

    expect(reloadSpy).toHaveBeenCalled()
  })

  test("clicking Support button opens Drift", async () => {
    const toggleMobileMenu = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <NavMenu toggleMobileMenu={toggleMobileMenu} mobileMenuIsOpen={false} />
      </BrowserRouter>
    )

    await user.click(result.getByRole("button", { name: "Support" }))

    expect(openDrift).toHaveBeenCalled()
  })

  test("clicking the Support button closes the mobile menu", async () => {
    const toggleMobileMenu = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <NavMenu toggleMobileMenu={toggleMobileMenu} mobileMenuIsOpen={false} />
      </BrowserRouter>
    )

    await user.click(result.getByRole("button", { name: "Support" }))

    expect(toggleMobileMenu).toHaveBeenCalled()
  })

  test("clicking the settings button closes the mobile menu", async () => {
    const toggleMobileMenu = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <NavMenu toggleMobileMenu={toggleMobileMenu} mobileMenuIsOpen={true} />
      </BrowserRouter>
    )

    await user.click(result.getByRole("link", { name: "Settings" }))

    expect(toggleMobileMenu).toHaveBeenCalled()
  })

  test("clicking the About button closes the mobile menu", async () => {
    const toggleMobileMenu = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <NavMenu toggleMobileMenu={toggleMobileMenu} mobileMenuIsOpen={true} />
      </BrowserRouter>
    )

    await user.click(result.getByRole("link", { name: "About Skate" }))

    expect(toggleMobileMenu).toHaveBeenCalled()
  })

  test("clicking the logo closes the mobile menu", async () => {
    const toggleMobileMenu = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <NavMenu toggleMobileMenu={toggleMobileMenu} mobileMenuIsOpen={true} />
      </BrowserRouter>
    )

    await user.click(result.getByTitle("Skate"))

    expect(toggleMobileMenu).toHaveBeenCalled()
  })

  test("clicking the close button closes the mobile menu", async () => {
    const toggleMobileMenu = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <NavMenu toggleMobileMenu={toggleMobileMenu} mobileMenuIsOpen={true} />
      </BrowserRouter>
    )

    await user.click(result.getByRole("button", { name: /close/i }))

    expect(toggleMobileMenu).toHaveBeenCalled()
  })
})
