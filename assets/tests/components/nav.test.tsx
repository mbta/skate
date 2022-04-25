import React from "react"
import { BrowserRouter } from "react-router-dom"
import { render } from "@testing-library/react"
import appData from "../../src/appData"
import { Nav } from "../../src/components/nav"
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

  test("renders mobile placeholder for new nav content", () => {
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

    expect(result.queryByText("Mobile nav placeholder.")).not.toBeNull()
    expect(result.queryByText("Tablet nav placeholder.")).toBeNull()
    expect(result.queryByText("Desktop nav placeholder.")).toBeNull()
  })

  test("renders tablet placeholder for new nav content", () => {
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

    expect(result.queryByText("Mobile nav placeholder.")).toBeNull()
    expect(result.queryByText("Tablet nav placeholder.")).not.toBeNull()
    expect(result.queryByText("Desktop nav placeholder.")).toBeNull()
  })

  test("renders desktop placeholder for new nav content", () => {
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

    expect(result.queryByText("Mobile nav placeholder.")).toBeNull()
    expect(result.queryByText("Tablet nav placeholder.")).toBeNull()
    expect(result.queryByText("Desktop nav placeholder.")).not.toBeNull()
  })

  test("renders beta version with feature flag", () => {
    ;(featureIsEnabled as jest.Mock).mockImplementationOnce(() => true)
    ;(appData as jest.Mock).mockImplementation(() => {
      return {
        navBetaFlag: "false",
      }
    })

    const result = render(
      <BrowserRouter>
        <Nav pickerContainerIsVisible={true} openView={OpenView.None}>
          Hello, world!
        </Nav>
      </BrowserRouter>
    )

    expect(result.queryByText("Desktop nav placeholder.")).not.toBeNull()
  })
})
