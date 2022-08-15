import React from "react"
import { BrowserRouter } from "react-router-dom"
import { render } from "@testing-library/react"
import appData from "../../src/appData"
import Nav from "../../src/components/nav"
import featureIsEnabled from "../../src/laboratoryFeatures"
import { OpenView } from "../../src/state"
import useDeviceType from "../../src/hooks/useDeviceType"

jest.mock("../../src/laboratoryFeatures", () => ({
  __esModule: true,
  default: jest.fn(() => false),
}))

jest.mock("../../src/appData", () => ({
  __esModule: true,
  default: jest.fn(() => false),
}))

jest.mock("../../src/hooks/useDeviceType", () => ({
  __esModule: true,
  default: jest.fn(() => "desktop"),
}))

describe("Nav", () => {
  test("renders children with TabBar", () => {
    const result = render(
      <BrowserRouter>
        <Nav pickerContainerIsVisible={true} openView={OpenView.None}>
          Hello, world!
        </Nav>
      </BrowserRouter>
    )

    expect(result.queryByText("Hello, world!")).not.toBeNull()
    expect(result.queryByTitle("Routes")).not.toBeNull()
  })

  test("renders with late view icon when dispatcher flag is set", () => {
    ;(featureIsEnabled as jest.Mock).mockImplementationOnce(() => false)
    ;(appData as jest.Mock).mockImplementation(() => {
      return {
        dispatcherFlag: "true",
      }
    })

    const result = render(
      <BrowserRouter>
        <Nav pickerContainerIsVisible={true} openView={OpenView.None}>
          Hello, world!
        </Nav>
      </BrowserRouter>
    )

    expect(result.queryByTestId("late-view-icon")).not.toBeNull()
  })

  test("renders mobile nav content", () => {
    ;(appData as jest.Mock).mockImplementation(() => {
      return {
        navBetaFlag: "true",
      }
    })
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
    ;(appData as jest.Mock).mockImplementation(() => {
      return {
        navBetaFlag: "true",
      }
    })
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
    ;(appData as jest.Mock).mockImplementation(() => {
      return {
        navBetaFlag: "true",
      }
    })
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
    ;(appData as jest.Mock).mockImplementation(() => {
      return {
        navBetaFlag: "true",
      }
    })

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
