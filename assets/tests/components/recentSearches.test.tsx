import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import RecentSearches from "../../src/components/recentSearches"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { setSearchText } from "../../src/models/search"
import { initialState } from "../../src/state"

describe("RecentSearches", () => {
  test("renders empty state", () => {
    const tree = renderer.create(<RecentSearches />).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders with data", () => {
    const searchWithData = {
      text: "999-555",
      property: "run",
      isActive: false,
      savedSearches: [
        { text: "poodle" },
        { text: "999-502" },
        { text: "999-501" },
      ],
    }
    const mockDispatch = jest.fn()
    const tree = renderer
      .create(
        <StateDispatchProvider
          state={{ ...initialState, search: searchWithData }}
          dispatch={mockDispatch}
        >
          <RecentSearches />
        </StateDispatchProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("clicking a recent search sets the search text", () => {
    const searchWithData = {
      text: "999-555",
      property: "run",
      isActive: false,
      savedSearches: [{ text: "poodle" }],
    }
    const mockDispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider
        state={{ ...initialState, search: searchWithData }}
        dispatch={mockDispatch}
      >
        <RecentSearches />
      </StateDispatchProvider>
    )

    wrapper.find(".m-recent-searches__button").simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(setSearchText("poodle"))
  })
})
