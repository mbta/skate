import { jest, describe, test, expect } from "@jest/globals"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import renderer from "react-test-renderer"
import RecentSearches from "../../src/components/recentSearches"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { initialState } from "../../src/state"
import { setSearchText } from "../../src/state/searchPageState"
import { searchPageStateFactory } from "../factories/searchPageState"

describe("RecentSearches", () => {
  test("renders empty state", () => {
    const tree = renderer.create(<RecentSearches />).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders with data", () => {
    const searchWithData = searchPageStateFactory.build({
      query: { text: "999-555", property: "run" },
      isActive: false,
      savedQueries: [
        { text: "poodle" },
        { text: "999-502" },
        { text: "999-501" },
      ],
    })
    const mockDispatch = jest.fn()
    const tree = renderer
      .create(
        <StateDispatchProvider
          state={{ ...initialState, searchPageState: searchWithData }}
          dispatch={mockDispatch}
        >
          <RecentSearches />
        </StateDispatchProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("clicking a recent searchPageState sets the searchPageState text", async () => {
    const searchWithData = searchPageStateFactory.build({
      query: { text: "999-555", property: "run" },
      savedQueries: [{ text: "poodle" }],
    })
    const mockDispatch = jest.fn()
    const result = render(
      <StateDispatchProvider
        state={{ ...initialState, searchPageState: searchWithData }}
        dispatch={mockDispatch}
      >
        <RecentSearches />
      </StateDispatchProvider>
    )

    await userEvent.click(result.getByRole("button", { name: "poodle" }))

    expect(mockDispatch).toHaveBeenCalledWith(setSearchText("poodle"))
  })
})
