import React from "react"
import renderer from "react-test-renderer"
import SearchPage from "../../src/components/searchPage"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { initialState } from "../../src/state"

describe("SearchPage", () => {
  test("renders", () => {
    const tree = renderer
      .create(
        <StateDispatchProvider state={initialState} dispatch={jest.fn()}>
          <SearchPage />
        </StateDispatchProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})
