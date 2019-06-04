import React from "react"
import renderer from "react-test-renderer"
import VehicleIcon from "../../src/components/vehicleIcon"

test("renders a triange vehicle icon", () => {
  const tree = renderer.create(<VehicleIcon />).toJSON()

  expect(tree).toMatchSnapshot()
})

test("allows you to scale the icon", () => {
  const tree = renderer.create(<VehicleIcon scale={0.5} />).toJSON()

  expect(tree).toMatchSnapshot()
})
