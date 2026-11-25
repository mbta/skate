import { afterEach, jest, describe, test, expect } from "@jest/globals"
import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom/jest-globals"
import * as browser from "../../../src/models/browser"
import NavMenu from "../../../src/components/nav/navMenu"
import { SocketProvider } from "../../../src/contexts/socketContext"
import { ConnectionStatus } from "../../../src/hooks/useSocket"
import { makeMockSocket } from "../../testHelpers/socketHelpers"
import { Router } from "../../testHelpers/wrappers"
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
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test("when mobile menu is open, clicking the backdrop toggled the mobile menu", async () => {
    const toggleMobileMenu = jest.fn()

    const user = userEvent.setup()
    render(
      <Router>
        <NavMenu toggleMobileMenu={toggleMobileMenu} mobileMenuIsOpen={true} />
      </Router>
    )

    await user.click(screen.getByTestId("nav-menu-backdrop"))

    expect(toggleMobileMenu).toHaveBeenCalled()
  })

  test("when mobile menu is closed, there is no backdrop", async () => {
    const toggleMobileMenu = jest.fn()

    render(
      <Router>
        <NavMenu toggleMobileMenu={toggleMobileMenu} mobileMenuIsOpen={false} />
      </Router>
    )

    expect(screen.queryByTestId("nav-menu-backdrop")).not.toBeInTheDocument()
  })

  test("mobile menu is visible", () => {
    const toggleMobileMenu = jest.fn()

    const result = render(
      <Router>
        <NavMenu toggleMobileMenu={toggleMobileMenu} mobileMenuIsOpen={true} />
      </Router>
    )

    expect(result.getByTestId("nav-menu")).toHaveClass("c-nav-menu--open")
  })

  test("mobile menu is not visible", () => {
    const toggleMobileMenu = jest.fn()

    const result = render(
      <Router>
        <NavMenu toggleMobileMenu={toggleMobileMenu} mobileMenuIsOpen={false} />
      </Router>
    )

    expect(result.getByTestId("nav-menu")).not.toHaveClass("c-nav-menu--open")
  })

  test("shows who is logged in", async () => {
    jest.mocked(getEmailAddress).mockReturnValue("test@example.localhost")

    render(
      <Router>
        <NavMenu toggleMobileMenu={jest.fn()} mobileMenuIsOpen={true} />
      </Router>
    )

    expect(await screen.findByText("Logged in as")).toBeVisible()
  })

  test("shows logout button", async () => {
    jest.mocked(getEmailAddress).mockReturnValue("test@example.localhost")

    render(
      <Router>
        <NavMenu toggleMobileMenu={jest.fn()} mobileMenuIsOpen={true} />
      </Router>
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
      <Router>
        <NavMenu toggleMobileMenu={toggleMobileMenu} mobileMenuIsOpen={true} />
      </Router>
    )

    await user.click(result.getByRole("button", { name: "Refresh" }))

    expect(reloadSpy).toHaveBeenCalled()
  })

  test("refresh button disconnects active socket with code 1000 before reloading", async () => {
    jest.mocked(getEmailAddress).mockReturnValue("test@example.localhost")
    const reloadSpy = jest.spyOn(browser, "reload").mockImplementation(() => {})
    const mockSocket = makeMockSocket()
    let completeDisconnect: (() => void) | undefined
    mockSocket.disconnect.mockImplementation((callback) => {
      completeDisconnect = callback
    })

    const user = userEvent.setup()
    const result = render(
      <SocketProvider
        socketStatus={{
          socket: mockSocket,
          connectionStatus: ConnectionStatus.Connected,
        }}
      >
        <Router>
          <NavMenu toggleMobileMenu={jest.fn()} mobileMenuIsOpen={true} />
        </Router>
      </SocketProvider>
    )

    await user.click(result.getByRole("button", { name: "Refresh" }))

    expect(mockSocket.disconnect).toHaveBeenCalledWith(
      expect.any(Function),
      1000
    )
    expect(reloadSpy).not.toHaveBeenCalled()

    completeDisconnect?.()
    expect(reloadSpy).toHaveBeenCalledTimes(1)
  })

  test("clicking the settings button closes the mobile menu", async () => {
    const toggleMobileMenu = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <Router>
        <NavMenu toggleMobileMenu={toggleMobileMenu} mobileMenuIsOpen={true} />
      </Router>
    )

    await user.click(result.getByRole("link", { name: "Settings" }))

    expect(toggleMobileMenu).toHaveBeenCalled()
  })

  test("clicking the About button closes the mobile menu", async () => {
    const toggleMobileMenu = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <Router>
        <NavMenu toggleMobileMenu={toggleMobileMenu} mobileMenuIsOpen={true} />
      </Router>
    )

    await user.click(result.getByRole("link", { name: "About Skate" }))

    expect(toggleMobileMenu).toHaveBeenCalled()
  })

  test("clicking the logo closes the mobile menu", async () => {
    const toggleMobileMenu = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <Router>
        <NavMenu toggleMobileMenu={toggleMobileMenu} mobileMenuIsOpen={true} />
      </Router>
    )

    await user.click(result.getByTitle("Skate"))

    expect(toggleMobileMenu).toHaveBeenCalled()
  })

  test("clicking the close button closes the mobile menu", async () => {
    const toggleMobileMenu = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <Router>
        <NavMenu toggleMobileMenu={toggleMobileMenu} mobileMenuIsOpen={true} />
      </Router>
    )

    await user.click(result.getByRole("button", { name: /close/i }))

    expect(toggleMobileMenu).toHaveBeenCalled()
  })
})
