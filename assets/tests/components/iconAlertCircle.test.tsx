import { test, expect } from "@jest/globals"
import React from "react"
import renderer from "react-test-renderer"
import IconAlertCircle, {
  AlertIconStyle,
  IconAlertCircleSvgNode,
} from "../../src/components/iconAlertCircle"

test("renders black", () => {
  const tree = renderer
    .create(<IconAlertCircle style={AlertIconStyle.Black} />)
    .toJSON()
  expect(tree).toMatchSnapshot()
})

test("renders greyOnGrey", () => {
  const tree = renderer
    .create(<IconAlertCircle style={AlertIconStyle.GreyOnGrey} />)
    .toJSON()
  expect(tree).toMatchSnapshot()
})

test("renders highlighted", () => {
  const tree = renderer
    .create(<IconAlertCircle style={AlertIconStyle.Highlighted} />)
    .toJSON()
  expect(tree).toMatchSnapshot()
})

test("renders an unwrapped svg node", () => {
  const tree = renderer
    .create(
      <svg>
        <IconAlertCircleSvgNode style={AlertIconStyle.Black} />
      </svg>
    )
    .toJSON()

  expect(tree).toMatchSnapshot()
})
