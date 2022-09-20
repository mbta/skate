import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import renderer from "react-test-renderer"
import "@testing-library/jest-dom"
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
    const result = render(
      <StateDispatchProvider state={invalidSearchState} dispatch={mockDispatch}>
        <SearchForm />
      </StateDispatchProvider>
    )

    expect(result.getByPlaceholderText("Search")).toHaveValue("1")

    expect(result.getByTitle("Submit")).toBeDisabled()
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
    const result = render(
      <StateDispatchProvider state={validSearchState} dispatch={mockDispatch}>
        <SearchForm />
      </StateDispatchProvider>
    )

    expect(result.getByPlaceholderText("Search")).toHaveValue("12")

    expect(result.getByTitle("Submit")).not.toBeDisabled()
  })

  test("clicking the submit button submits the query", async () => {
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
    const result = render(
      <StateDispatchProvider state={validSearchState} dispatch={testDispatch}>
        <SearchForm />
      </StateDispatchProvider>
    )

    await userEvent.click(result.getByTitle("Submit"))
    expect(testDispatch).toHaveBeenCalledWith(submitSearch())
  })

  test("entering text sets it as the search text", async () => {
    const validSearch: SearchPageState = {
      query: { text: "12", property: "run" },
      isActive: false,
      savedQueries: [],
    }
    const validSearchState = {
      ...initialState,
      searchPageState: validSearch,
    }

    const testDispatch = jest.fn()

    const result = render(
      <StateDispatchProvider state={validSearchState} dispatch={testDispatch}>
        <SearchForm />
      </StateDispatchProvider>
    )

    await userEvent.type(result.getByPlaceholderText("Search"), "3")

    expect(testDispatch).toHaveBeenCalledWith(setSearchText("123"))
  })

  test("clicking the clear button empties the search text", async () => {
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
    const result = render(
      <StateDispatchProvider state={validSearchState} dispatch={testDispatch}>
        <SearchForm />
      </StateDispatchProvider>
    )

    await userEvent.click(result.getByTitle("Clear"))

    expect(testDispatch).toHaveBeenCalledWith(setSearchText(""))
  })

  test("clicking a search property selects it", async () => {
    const testDispatch = jest.fn()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={testDispatch}>
        <SearchForm />
      </StateDispatchProvider>
    )

    await userEvent.click(result.getByRole("radio", { name: "run" }))

    expect(testDispatch).toHaveBeenCalledWith(setSearchProperty("run"))
  })

  test("clicking a search property submits the search", async () => {
    const testDispatch = jest.fn()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={testDispatch}>
        <SearchForm />
      </StateDispatchProvider>
    )

    await userEvent.click(result.getByRole("radio", { name: "run" }))

    expect(testDispatch).toHaveBeenCalledWith(submitSearch())
  })
})
