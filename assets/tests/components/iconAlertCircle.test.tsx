import React from "react"
import renderer from "react-test-renderer"
import IconAlertCircle, {
  IconAlertCircleSvgNode,
} from "../../src/components/iconAlertCircle"

test("renders", () => {
  const tree = renderer.create(<IconAlertCircle />).toJSON()
  expect(tree).toMatchSnapshot()
})

test("renders an unwrapped svg node", () => {
  const tree = renderer
    .create(
      <svg>
        <IconAlertCircleSvgNode />
      </svg>
    )
    .toJSON()

  expect(tree).toMatchSnapshot()
})
