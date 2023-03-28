import React from "react"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"
import * as browser from "../../../src/models/browser"
import { openDrift } from "../../../src/helpers/drift"
import { displayHelp } from "../../../src/helpers/appCue"
import NavMenu from "../../../src/components/nav/navMenu"
import { BrowserRouter } from "react-router-dom"

jest.mock("../../../src/helpers/drift", () => ({
  __esModule: true,
  openDrift: jest.fn(),
}))

jest.mock("../../../src/helpers/appCue", () => ({
  __esModule: true,
  displayHelp: jest.fn(),
}))

describe("NavMenu", () => {
  test("clicking the backdrop expanded/collapsed state", async () => {
    const toggleMobileMenu = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <NavMenu toggleMobileMenu={toggleMobileMenu} mobileMenuIsOpen={false} />
      </BrowserRouter>
    )

    await user.click(result.getByTestId("nav-menu-backdrop"))

    expect(toggleMobileMenu).toHaveBeenCalled()
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

    await user.click(result.getByTitle("Refresh"))

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

    await user.click(result.getByTitle("Support"))

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

    await user.click(result.getByTitle("Support"))

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

    await user.click(result.getByTitle("Settings"))

    expect(toggleMobileMenu).toHaveBeenCalled()
  })

  test("clicking About Skate button displays help", async () => {
    const toggleMobileMenu = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <NavMenu toggleMobileMenu={toggleMobileMenu} mobileMenuIsOpen={false} />
      </BrowserRouter>
    )

    await user.click(result.getByTitle("About Skate"))

    expect(displayHelp).toHaveBeenCalled()
  })

  test("clicking the About button closes the mobile menu", async () => {
    const toggleMobileMenu = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <NavMenu toggleMobileMenu={toggleMobileMenu} mobileMenuIsOpen={true} />
      </BrowserRouter>
    )

    await user.click(result.getByTitle("About Skate"))

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
