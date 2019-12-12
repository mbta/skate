import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import SearchForm from "../../src/components/searchForm"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { initialState } from "../../src/state"
import {
  SearchPageState,
  setSearchProperty,
  setSearchText,
  submitSearch,
} from "../../src/state/searchPageState"

const mockDispatch = jest.fn()

describe("SearchForm", () => {
  test("renders", () => {
    const tree = renderer
      .create(
        <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
          <SearchForm />
        </StateDispatchProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("submit button is disabled if there are fewer than 2 characters in the text field", () => {
    const invalidSearch: SearchPageState = {
      query: { text: "1", property: "run" },
      isActive: false,
      savedQueries: [],
    }
    const invalidSearchState = {
      ...initialState,
      searchPageState: invalidSearch,
    }
    const wrapper = mount(
      <StateDispatchProvider state={invalidSearchState} dispatch={mockDispatch}>
        <SearchForm />
      </StateDispatchProvider>
    )

    expect(wrapper.find(".m-search-form__input").prop("value")).toEqual("1")
    expect(wrapper.find(".m-search-form__submit").prop("disabled")).toBeTruthy()
  })

  test("submit button is enable if there are at least 2 characters in the text field", () => {
    const validSearch: SearchPageState = {
      query: { text: "12", property: "run" },
      isActive: false,
      savedQueries: [],
    }
    const validSearchState = {
      ...initialState,
      searchPageState: validSearch,
    }
    const wrapper = mount(
      <StateDispatchProvider state={validSearchState} dispatch={mockDispatch}>
        <SearchForm />
      </StateDispatchProvider>
    )

    expect(wrapper.find(".m-search-form__input").prop("value")).toEqual("12")
    expect(wrapper.find(".m-search-form__submit").prop("disabled")).toBeFalsy()
  })

  test("clicking the submit button submits the query", () => {
    const testDispatch = jest.fn()
    const validSearch: SearchPageState = {
      query: { text: "12", property: "run" },
      isActive: false,
      savedQueries: [],
    }
    const validSearchState = {
      ...initialState,
      searchPageState: validSearch,
    }
    const wrapper = mount(
      <StateDispatchProvider state={validSearchState} dispatch={testDispatch}>
        <SearchForm />
      </StateDispatchProvider>
    )

    wrapper.find(".m-search-form__submit").simulate("click")

    expect(testDispatch).toHaveBeenCalledWith(submitSearch())
  })

  test("entering text sets it as the search text", () => {
    const testDispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={testDispatch}>
        <SearchForm />
      </StateDispatchProvider>
    )

    const testEvent = {
      currentTarget: {
        value: "test input",
      },
    } as React.ChangeEvent<HTMLInputElement>
    wrapper.find(".m-search-form__input").prop("onChange")!(testEvent)

    expect(testDispatch).toHaveBeenCalledWith(setSearchText("test input"))
  })

  test("clicking the clear button empties the search text", () => {
    const testDispatch = jest.fn()
    const validSearch: SearchPageState = {
      query: { text: "12", property: "run" },
      isActive: false,
      savedQueries: [],
    }
    const validSearchState = {
      ...initialState,
      searchPageState: validSearch,
    }
    const wrapper = mount(
      <StateDispatchProvider state={validSearchState} dispatch={testDispatch}>
        <SearchForm />
      </StateDispatchProvider>
    )

    wrapper.find(".m-search-form__clear").simulate("click")

    expect(testDispatch).toHaveBeenCalledWith(setSearchText(""))
  })

  test("clicking a search property selects it", () => {
    const testDispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={testDispatch}>
        <SearchForm />
      </StateDispatchProvider>
    )

    const testEvent = {
      currentTarget: {
        name: "property",
        value: "run",
      },
    } as React.FormEvent<HTMLInputElement>
    wrapper
      .find(".m-search-form__property-input")
      .at(1)
      .simulate("change", testEvent)

    expect(testDispatch).toHaveBeenCalledWith(setSearchProperty("run"))
  })

  test("clicking a search property submits the search", () => {
    const testDispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={testDispatch}>
        <SearchForm />
      </StateDispatchProvider>
    )

    const testEvent = {
      currentTarget: {
        name: "property",
        value: "run",
      },
    } as React.FormEvent<HTMLInputElement>
    wrapper
      .find(".m-search-form__property-input")
      .at(1)
      .simulate("change", testEvent)

    expect(testDispatch).toHaveBeenCalledWith(submitSearch())
  })
})
