import React from "react"
import renderer from "react-test-renderer"
import ShuttleMapPage from "../../src/components/shuttleMapPage"

describe("Shuttle Map Page", () => {
  test("renders", () => {
    const tree = renderer.create(<ShuttleMapPage />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
