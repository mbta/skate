import React from "react"
import { BrowserRouter } from "react-router-dom"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import Nav from "../../src/components/nav"
import { OpenView } from "../../src/state"
import useScreenSize from "../../src/hooks/useScreenSize"
import getTestGroups from "../../src/userTestGroups"
import { MAP_BETA_GROUP_NAME } from "../../src/userInTestGroup"

jest.mock("../../src/hooks/useScreenSize", () => ({
  __esModule: true,
  default: jest.fn(() => "desktop"),
}))

jest.mock("userTestGroups", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}))

beforeEach(() => {
  ;(getTestGroups as jest.Mock).mockReturnValue([])
})

describe("Nav", () => {
  test("renders mobile nav content", () => {
    ;(useScreenSize as jest.Mock).mockImplementationOnce(() => "mobile")

    const result = render(
      <BrowserRouter>
        <Nav pickerContainerIsVisible={true} openView={OpenView.None}>
          Hello, world!
        </Nav>
      </BrowserRouter>
    )

    expect(result.getByTestId("top-nav-mobile")).not.toBeNull()
    expect(result.getByTestId("bottom-nav-mobile")).not.toBeNull()
  })

  test("renders mobile landscape / tablet portrait nav content", () => {
    ;(useScreenSize as jest.Mock).mockImplementationOnce(
      () => "mobile_landscape_tablet_portrait"
    )

    const result = render(
      <BrowserRouter>
        <Nav pickerContainerIsVisible={true} openView={OpenView.None}>
          Hello, world!
        </Nav>
      </BrowserRouter>
    )

    expect(result.queryByTitle("Route Ladders")).not.toBeNull()
    expect(result.queryByText("Route Ladders")).toBeNull()
  })

  test("renders tablet nav content", () => {
    ;(useScreenSize as jest.Mock).mockImplementationOnce(() => "tablet")

    const result = render(
      <BrowserRouter>
        <Nav pickerContainerIsVisible={true} openView={OpenView.None}>
          Hello, world!
        </Nav>
      </BrowserRouter>
    )

    expect(result.queryByTitle("Route Ladders")).not.toBeNull()
    expect(result.queryByText("Route Ladders")).toBeNull()
  })

  test("renders nav item with title 'Search Map' if in map test group", () => {
    ;(getTestGroups as jest.Mock).mockReturnValue([MAP_BETA_GROUP_NAME])

    render(
      <BrowserRouter>
        <Nav pickerContainerIsVisible={true} openView={OpenView.None}>
          Hello, world!
        </Nav>
      </BrowserRouter>
    )

    expect(screen.queryByTitle("Search")).toBeNull()
    expect(screen.queryByTitle("Search Map")).toBeInTheDocument()
  })

  test("renders desktop nav content", () => {
    const result = render(
      <BrowserRouter>
        <Nav pickerContainerIsVisible={true} openView={OpenView.None}>
          Hello, world!
        </Nav>
      </BrowserRouter>
    )

    expect(result.queryByTitle("Route Ladders")).not.toBeNull()
    expect(result.queryByText("Route Ladders")).not.toBeNull()
  })
})
