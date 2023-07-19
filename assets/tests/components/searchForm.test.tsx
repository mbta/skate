import { render, screen } from "@testing-library/react"
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
import { mockFullStoryEvent } from "../testHelpers/mockHelpers"
import { searchPageStateFactory } from "../factories/searchPageState"
import stateFactory from "../factories/applicationState"
import { clearButton } from "../testHelpers/selectors/components/searchForm"

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

  test("submit button is disabled if there are fewer than 3 characters in the text field", () => {
    const invalidSearch: SearchPageState = searchPageStateFactory.build({
      query: { text: "1", property: "run" },
    })
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

  test("submit button is enabled if there are at least 3 characters in the text field", () => {
    const searchText = "123"
    const validSearch = searchPageStateFactory.build({
      query: { text: searchText, property: "run" },
    })
    const validSearchState = {
      ...initialState,
      searchPageState: validSearch,
    }
    const result = render(
      <StateDispatchProvider state={validSearchState} dispatch={mockDispatch}>
        <SearchForm />
      </StateDispatchProvider>
    )

    expect(result.getByPlaceholderText("Search")).toHaveValue(searchText)

    expect(result.getByTitle("Submit")).not.toBeDisabled()
  })

  test("clicking the submit button submits the query", async () => {
    const testDispatch = jest.fn()
    const validSearch: SearchPageState = searchPageStateFactory.build({
      query: { text: "123", property: "run" },
    })
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

  test("clicking the submit button also calls onSubmit when set", async () => {
    const testDispatch = jest.fn()
    const onSubmit = jest.fn()
    const validSearch: SearchPageState = searchPageStateFactory.build({
      query: { text: "123", property: "run" },
    })
    const validSearchState = {
      ...initialState,
      searchPageState: validSearch,
    }
    render(
      <StateDispatchProvider state={validSearchState} dispatch={testDispatch}>
        <SearchForm onSubmit={onSubmit} />
      </StateDispatchProvider>
    )

    await userEvent.click(screen.getByTitle("Submit"))
    expect(testDispatch).toHaveBeenCalledWith(submitSearch())
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  test("clicking the submit button logs a FullStory event when provided", async () => {
    const testDispatch = jest.fn()
    const onSubmit = jest.fn()
    const validSearch: SearchPageState = searchPageStateFactory.build({
      query: { text: "123", property: "run" },
    })
    const validSearchState = {
      ...initialState,
      searchPageState: validSearch,
    }
    mockFullStoryEvent()

    render(
      <StateDispatchProvider state={validSearchState} dispatch={testDispatch}>
        <SearchForm onSubmit={onSubmit} submitEvent="Test event" />
      </StateDispatchProvider>
    )
    await userEvent.click(screen.getByTitle("Submit"))

    expect(window.FS!.event).toHaveBeenCalledWith("Test event")
  })

  test("entering text sets it as the search text", async () => {
    const searchText = "12"
    const searchInput = "3"
    const validSearch: SearchPageState = searchPageStateFactory.build({
      query: { text: searchText, property: "run" },
    })
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

    await userEvent.type(result.getByPlaceholderText("Search"), searchInput)

    expect(testDispatch).toHaveBeenCalledWith(
      setSearchText(searchText + searchInput)
    )
  })

  test("when search input is empty, should not display clear button", () => {
    const validSearchState = stateFactory.build({
      searchPageState: { query: { text: "", property: "run" } },
    })

    render(
      <StateDispatchProvider state={validSearchState} dispatch={jest.fn()}>
        <SearchForm />
      </StateDispatchProvider>
    )

    expect(clearButton.query()).not.toBeInTheDocument()
  })

  test("when search input is not empty, should display clear button", () => {
    const validSearchState = stateFactory.build({
      searchPageState: { query: { text: "1", property: "run" } },
    })

    render(
      <StateDispatchProvider state={validSearchState} dispatch={jest.fn()}>
        <SearchForm />
      </StateDispatchProvider>
    )

    expect(clearButton.get()).toBeInTheDocument()
  })

  test("clicking the clear button empties the search text", async () => {
    const testDispatch = jest.fn()
    const validSearch: SearchPageState = searchPageStateFactory.build({
      query: { text: "123", property: "run" },
    })
    const validSearchState = {
      ...initialState,
      searchPageState: validSearch,
    }
    render(
      <StateDispatchProvider state={validSearchState} dispatch={testDispatch}>
        <SearchForm />
      </StateDispatchProvider>
    )

    await userEvent.click(clearButton.get())

    expect(testDispatch).toHaveBeenCalledWith(setSearchText(""))
  })

  test("clicking the clear button also calls onClear when set", async () => {
    const testDispatch = jest.fn()
    const onClear = jest.fn()
    const validSearch: SearchPageState = searchPageStateFactory.build({
      query: { text: "12", property: "run" },
    })
    const validSearchState = {
      ...initialState,
      searchPageState: validSearch,
    }
    render(
      <StateDispatchProvider state={validSearchState} dispatch={testDispatch}>
        <SearchForm onClear={onClear} />
      </StateDispatchProvider>
    )

    await userEvent.click(clearButton.get())

    expect(testDispatch).toHaveBeenCalledWith(setSearchText(""))
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  test("clicking a search property selects it", async () => {
    const testDispatch = jest.fn()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={testDispatch}>
        <SearchForm />
      </StateDispatchProvider>
    )

    await userEvent.click(result.getByRole("button", { name: "Runs" }))

    expect(testDispatch).toHaveBeenCalledWith(setSearchProperty("run"))
  })

  test("clicking a search property submits the search", async () => {
    const testDispatch = jest.fn()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={testDispatch}>
        <SearchForm />
      </StateDispatchProvider>
    )

    await userEvent.click(result.getByRole("button", { name: "Runs" }))

    expect(testDispatch).toHaveBeenCalledWith(submitSearch())
  })
})
