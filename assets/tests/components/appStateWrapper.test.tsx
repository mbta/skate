import React from "react"
import renderer from "react-test-renderer"
import AppStateWrapper, {
  readUserToken,
} from "../../src/components/appStateWrapper"

test("renders", () => {
  const tree = renderer.create(<AppStateWrapper />).toJSON()
  expect(tree).toMatchSnapshot()
})

test("reads the user token from the page", () => {
  const mockElement = {
    dataset: {
      userToken: "mock-token",
    },
  }
  // @ts-ignore
  document.getElementById = () => mockElement

  expect(readUserToken()).toEqual("mock-token")
})
