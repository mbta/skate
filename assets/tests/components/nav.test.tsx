import { jest, describe, test, expect, beforeEach } from "@jest/globals"
import React from "react"
import { Router } from "../testHelpers/wrappers"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"

import Nav from "../../src/components/nav"
import useScreenSize from "../../src/hooks/useScreenSize"
import getTestGroups from "../../src/userTestGroups"
import { mockUsePanelState } from "../testHelpers/usePanelStateMocks"

jest.mock("../../src/hooks/useScreenSize", () => ({
  __esModule: true,
  default: jest.fn(() => "desktop"),
}))

jest.mock("userTestGroups", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}))

jest.mock("../../src/hooks/usePanelState")

beforeEach(() => {
  mockUsePanelState({ isViewOpen: false })
  jest.mocked(getTestGroups).mockReturnValue([])
})

describe("Nav", () => {
  test("renders mobile nav content", () => {
    jest.mocked(useScreenSize).mockReturnValueOnce("mobile")

    const result = render(
      <Router>
        <Nav>Hello, world!</Nav>
      </Router>
    )

    expect(result.getByTestId("top-nav-mobile")).not.toBeNull()
    expect(result.getByTestId("bottom-nav-mobile")).not.toBeNull()
  })

  test("renders mobile landscape / tablet portrait nav content", () => {
    jest
      .mocked(useScreenSize)
      .mockReturnValueOnce("mobile_landscape_tablet_portrait")

    const { container } = render(
      <Router>
        <Nav>Hello, world!</Nav>
      </Router>
    )

    expect(container.querySelector(".c-left-nav")).toHaveClass(
      "c-left-nav--collapsed"
    )
  })

  test("renders mobile landscape / tablet portrait nav content with nav elements hidden when a view is open", () => {
    mockUsePanelState({ isViewOpen: true })
    jest
      .mocked(useScreenSize)
      .mockReturnValueOnce("mobile_landscape_tablet_portrait")

    const result = render(
      <Router>
        <Nav>Hello, world!</Nav>
      </Router>
    )

    expect(result.getByTitle("Route Ladders")).not.toBeVisible()
    expect(result.getByTitle("Skate")).not.toBeVisible()
  })

  test("renders tablet nav content", () => {
    jest.mocked(useScreenSize).mockReturnValueOnce("tablet")

    const { container } = render(
      <Router>
        <Nav>Hello, world!</Nav>
      </Router>
    )

    expect(container.querySelector(".c-left-nav")).toHaveClass(
      "c-left-nav--collapsed"
    )
  })

  test("renders nav item with title 'Search Map'", () => {
    render(
      <Router>
        <Nav>Hello, world!</Nav>
      </Router>
    )

    expect(screen.queryByTitle("Search Map")).toBeInTheDocument()
  })

  test("renders desktop nav content", () => {
    jest.mocked(useScreenSize).mockReturnValueOnce("desktop")

    const result = render(
      <Router>
        <Nav>Hello, world!</Nav>
      </Router>
    )

    expect(result.queryByTitle("Route Ladders")).not.toBeNull()
    expect(result.queryByText("Route Ladders")).not.toBeNull()
  })
})
