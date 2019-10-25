import { shallow } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import SearchForm from "../../src/components/searchForm"
import {
  initialSearch,
  Search,
  setSearchProperty,
  setSearchText,
} from "../../src/models/search"

const mockDispatch = jest.fn()

describe("SearchForm", () => {
  test("renders", () => {
    const tree = renderer
      .create(<SearchForm search={initialSearch} dispatch={mockDispatch} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("submit button is disabled if there are fewer than 2 characters in the text field", () => {
    const invalidSearch: Search = {
      text: "1",
      property: "run",
    }
    const wrapper = shallow(
      <SearchForm search={invalidSearch} dispatch={mockDispatch} />
    )

    expect(wrapper.find(".m-search-form__text").prop("value")).toEqual("1")
    expect(wrapper.find(".m-search-form__submit").prop("disabled")).toBeTruthy()
  })

  test("submit button is enable if there are at least 2 characters in the text field", () => {
    const invalidSearch: Search = {
      text: "12",
      property: "run",
    }
    const wrapper = shallow(
      <SearchForm search={invalidSearch} dispatch={mockDispatch} />
    )

    expect(wrapper.find(".m-search-form__text").prop("value")).toEqual("12")
    expect(wrapper.find(".m-search-form__submit").prop("disabled")).toBeFalsy()
  })

  test("entering text sets it as the search text", () => {
    const testDispatch = jest.fn()
    const wrapper = shallow(
      <SearchForm search={initialSearch} dispatch={testDispatch} />
    )

    const testEvent = {
      currentTarget: {
        value: "test input",
      },
    } as React.ChangeEvent<HTMLInputElement>
    wrapper.find(".m-search-form__text").simulate("change", testEvent)

    expect(testDispatch).toHaveBeenCalledWith(setSearchText("test input"))
  })

  test("clicking a search property selects it", () => {
    const testDispatch = jest.fn()

    const wrapper = shallow(
      <SearchForm search={initialSearch} dispatch={testDispatch} />
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
})
