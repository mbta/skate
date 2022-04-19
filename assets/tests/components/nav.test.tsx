import React from "react"
import { BrowserRouter } from "react-router-dom"
import renderer from "react-test-renderer"
import { Nav } from "../../src/components/nav"
import { OpenView } from "../../src/state"

describe("Nav", () => {
  test("renders children with TabBar", () => {
    const tree = renderer
      .create(
        <BrowserRouter>
          <Nav pickerContainerIsVisible={true} openView={OpenView.None}>
            Hello, world!
          </Nav>
        </BrowserRouter>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
