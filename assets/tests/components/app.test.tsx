import React from "react"
import renderer from "react-test-renderer"
import App from "../../src/components/app"

jest.mock("../../src/laboratoryFeatures", () => ({
  __esModule: true,
  default: () => true,
}))

describe("App", () => {
  test("renders", () => {
    const tree = renderer.create(<App />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
