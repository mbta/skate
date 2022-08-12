import React from "react"
import { BrowserRouter } from "react-router-dom"
import { render } from "@testing-library/react"
import Nav from "../../src/components/nav"
import { OpenView } from "../../src/state"
import useDeviceType from "../../src/hooks/useDeviceType"

jest.mock("../../src/hooks/useDeviceType", () => ({
  __esModule: true,
  default: jest.fn(() => "desktop"),
}))

describe("Nav", () => {
  test("renders mobile nav content", () => {
    ;(useDeviceType as jest.Mock).mockImplementationOnce(() => "mobile")

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
    ;(useDeviceType as jest.Mock).mockImplementationOnce(
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
    ;(useDeviceType as jest.Mock).mockImplementationOnce(() => "tablet")

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
