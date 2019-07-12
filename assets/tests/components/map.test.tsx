import React from "react"
import renderer from "react-test-renderer"
import Map from "../../src/components/map"

describe("map", () => {
  test("renders", () => {
    const tree = renderer
      .create(
        <Map bearing={33} latitude={42.0} longitude={-71.0} label={"1818"} />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})
