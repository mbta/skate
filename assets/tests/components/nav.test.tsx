import React from "react"
import { BrowserRouter } from "react-router-dom"
import { render } from "@testing-library/react"
import appData from "../../src/appData"
import { Nav } from "../../src/components/nav"
import featureIsEnabled from "../../src/laboratoryFeatures"
import { OpenView } from "../../src/state"

jest.mock("../../src/laboratoryFeatures", () => ({
  __esModule: true,
  default: jest.fn(() => false),
}))

jest.mock("../../src/appData", () => ({
  __esModule: true,
  default: jest.fn(() => false),
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
})
