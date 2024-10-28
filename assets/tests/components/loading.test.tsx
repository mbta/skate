import { test, expect } from "@jest/globals"
import React from "react"
import renderer from "react-test-renderer"
import Loading from "../../src/components/loading"

test("renders loading text", () => {
  const tree = renderer.create(<Loading />).toJSON()

  expect(tree).toMatchSnapshot()
})
