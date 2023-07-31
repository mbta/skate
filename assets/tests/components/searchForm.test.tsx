import "@testing-library/jest-dom"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import renderer from "react-test-renderer"
import SearchFormFromStateDispatchContext, {
  SearchForm,
} from "../../src/components/searchForm"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { initialState } from "../../src/state"
import {
  SearchPageState,
  setSearchProperties,
  setSearchText,
  submitSearch,
} from "../../src/state/searchPageState"
import stateFactory from "../factories/applicationState"
import {
  clearButton,
  locationFilter,
  operatorFilter,
  runFilter,
  searchInput,
  submitButton,
  vehicleFilter,
} from "../testHelpers/selectors/components/searchForm"
import { searchPageStateFactory } from "../factories/searchPageState"
import { searchQueryVehicleFactory } from "../factories/searchQuery"
import {
  listbox as autocompleteListbox,
  option as autocompleteOption,
} from "../testHelpers/selectors/components/groupedAutocomplete"
import { useAutocompleteResults } from "../../src/hooks/useAutocompleteResults"
import vehicleFactory from "../factories/vehicle"

jest.mock("../../src/hooks/useAutocompleteResults", () => ({
  useAutocompleteResults: jest.fn().mockImplementation(() => ({
    operator: [],
    run: [],
    vehicle: [],
  })),
}))

const mockDispatch = jest.fn()

describe("SearchForm", () => {
  test("renders", () => {
    const tree = renderer
      .create(
        <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
          <SearchFormFromStateDispatchContext />
        </StateDispatchProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("when search input has less than the minimum amount of characters, should disable submit button", () => {
    const invalidSearch: SearchPageState = searchPageStateFactory.build({
      query: { text: "1", property: "run" },
    })
    const invalidSearchState = {
      ...initialState,
      searchPageState: invalidSearch,
    }
    render(
      <StateDispatchProvider state={invalidSearchState} dispatch={mockDispatch}>
        <SearchFormFromStateDispatchContext />
      </StateDispatchProvider>
    )

    expect(searchInput.get()).toHaveValue("1")

    expect(submitButton.get()).toBeDisabled()
  })

  test("when search input has the minimum amount of characters, should enable submit button", () => {
    const searchText = "12"
    const validSearch = searchPageStateFactory.build({
      query: { text: searchText, property: "run" },
    })
    const validSearchState = {
      ...initialState,
      searchPageState: validSearch,
    }
    render(
      <StateDispatchProvider state={validSearchState} dispatch={mockDispatch}>
        <SearchFormFromStateDispatchContext />
      </StateDispatchProvider>
    )

    expect(searchInput.get()).toHaveValue(searchText)

    expect(submitButton.get()).not.toBeDisabled()
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
    render(
      <StateDispatchProvider state={validSearchState} dispatch={testDispatch}>
        <SearchFormFromStateDispatchContext />
      </StateDispatchProvider>
    )

    await userEvent.click(submitButton.get())
    expect(testDispatch).toHaveBeenCalledWith(submitSearch())
  })

  test("when enter is pressed on the searchInput, should submit query", async () => {
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
        <SearchFormFromStateDispatchContext />
      </StateDispatchProvider>
    )

    await userEvent.type(searchInput.get(), "{Enter}")

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
        <SearchFormFromStateDispatchContext onSubmit={onSubmit} />
      </StateDispatchProvider>
    )

    await userEvent.click(submitButton.get())
    expect(testDispatch).toHaveBeenCalledWith(submitSearch())
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  test("entering text sets it as the search text", async () => {
    const searchText = "12"
    const searchNextInput = "3"
    const validSearch: SearchPageState = searchPageStateFactory.build({
      query: { text: searchText, property: "run" },
    })
    const validSearchState = {
      ...initialState,
      searchPageState: validSearch,
    }

    const testDispatch = jest.fn()

    render(
      <StateDispatchProvider state={validSearchState} dispatch={testDispatch}>
        <SearchFormFromStateDispatchContext />
      </StateDispatchProvider>
    )

    await userEvent.type(searchInput.get(), searchNextInput)

    expect(testDispatch).toHaveBeenCalledWith(
      setSearchText(searchText + searchNextInput)
    )
  })

  test("when search input is empty, should not display clear button", () => {
    const validSearchState = stateFactory.build({
      searchPageState: { query: { text: "", property: "run" } },
    })

    render(
      <StateDispatchProvider state={validSearchState} dispatch={jest.fn()}>
        <SearchFormFromStateDispatchContext />
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
        <SearchFormFromStateDispatchContext />
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
        <SearchFormFromStateDispatchContext />
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
        <SearchFormFromStateDispatchContext onClear={onClear} />
      </StateDispatchProvider>
    )

    await userEvent.click(clearButton.get())

    expect(testDispatch).toHaveBeenCalledWith(setSearchText(""))
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  describe("filters", () => {
    test("all filters are shown as inactive by default", () => {
      const testDispatch = jest.fn()
      render(
        <StateDispatchProvider state={initialState} dispatch={testDispatch}>
          <SearchFormFromStateDispatchContext />
        </StateDispatchProvider>
      )

      expect(vehicleFilter.get()).toHaveAttribute("aria-pressed", "false")
      expect(operatorFilter.get()).toHaveAttribute("aria-pressed", "false")
      expect(runFilter.get()).toHaveAttribute("aria-pressed", "false")
      expect(locationFilter.get()).toHaveAttribute("aria-pressed", "false")
    })

    test("when some but not all of the properties have limits, those filters are active", () => {
      const testDispatch = jest.fn()
      render(
        <StateDispatchProvider
          state={{
            ...initialState,
            searchPageState: searchPageStateFactory.build({
              query: searchQueryVehicleFactory.build({
                text: "123",
                properties: { vehicle: 5 },
              }),
            }),
          }}
          dispatch={testDispatch}
        >
          <SearchFormFromStateDispatchContext />
        </StateDispatchProvider>
      )

      expect(vehicleFilter.get()).toHaveAttribute("aria-pressed", "true")
      expect(operatorFilter.get()).toHaveAttribute("aria-pressed", "false")
      expect(runFilter.get()).toHaveAttribute("aria-pressed", "false")
      expect(locationFilter.get()).toHaveAttribute("aria-pressed", "false")
    })

    test("when the first filter is toggled on, dispatches that only that filter should be active", async () => {
      const testDispatch = jest.fn()
      render(
        <StateDispatchProvider state={initialState} dispatch={testDispatch}>
          <SearchFormFromStateDispatchContext />
        </StateDispatchProvider>
      )

      await userEvent.click(vehicleFilter.get())
      expect(testDispatch).toHaveBeenCalledWith(
        setSearchProperties(["vehicle"])
      )
    })

    test("when all filters are toggled on, then all filters are shown as active", async () => {
      const testDispatch = jest.fn()
      render(
        <StateDispatchProvider state={initialState} dispatch={testDispatch}>
          <SearchFormFromStateDispatchContext />
        </StateDispatchProvider>
      )

      await userEvent.click(vehicleFilter.get())
      await userEvent.click(operatorFilter.get())
      await userEvent.click(runFilter.get())
      await userEvent.click(locationFilter.get())

      expect(vehicleFilter.get()).toHaveAttribute("aria-pressed", "true")
      expect(operatorFilter.get()).toHaveAttribute("aria-pressed", "true")
      expect(runFilter.get()).toHaveAttribute("aria-pressed", "true")
      expect(locationFilter.get()).toHaveAttribute("aria-pressed", "true")
    })

    test("when the only filter that is toggled on is toggled off, then sets the list of search properties to all properties", async () => {
      const testDispatch = jest.fn()
      render(
        <StateDispatchProvider
          state={{
            ...initialState,
            searchPageState: searchPageStateFactory.build({
              query: searchQueryVehicleFactory.build({
                text: "123",
                properties: { vehicle: 5 },
              }),
            }),
          }}
          dispatch={testDispatch}
        >
          <SearchFormFromStateDispatchContext />
        </StateDispatchProvider>
      )

      await userEvent.click(vehicleFilter.get())
      expect(testDispatch).toHaveBeenCalledWith(
        setSearchProperties(
          expect.arrayContaining(["vehicle", "operator", "run", "location"])
        )
      )
    })

    test("clicking a search property submits the search", async () => {
      const testDispatch = jest.fn()
      const result = render(
        <StateDispatchProvider state={initialState} dispatch={testDispatch}>
          <SearchFormFromStateDispatchContext />
        </StateDispatchProvider>
      )

      await userEvent.click(result.getByRole("button", { name: "Runs" }))

      expect(testDispatch).toHaveBeenCalledWith(submitSearch())
    })
  })

  test("when the search text length is greater than or equal to the minium character count, should show autocomplete", () => {
    render(
      <SearchForm
        inputText="123"
        filters={{
          location: false,
          operator: true,
          run: true,
          vehicle: true,
        }}
        onFiltersChanged={() => {}}
        onSelectVehicleOption={() => {}}
      />
    )

    expect(autocompleteListbox().get()).toBeInTheDocument()
  })

  test("when the search text length is less than the minium character count, should not show autocomplete", () => {
    render(
      <SearchForm
        inputText="12"
        filters={{
          location: false,
          operator: true,
          run: true,
          vehicle: true,
        }}
        onFiltersChanged={() => {}}
        onSelectVehicleOption={() => {}}
      />
    )

    expect(autocompleteListbox().get()).not.toBeVisible()
  })

  test("when the search is submitted, should not show autocomplete", async () => {
    render(
      <SearchForm
        inputText="123"
        filters={{
          location: false,
          operator: true,
          run: true,
          vehicle: true,
        }}
        // Prevent the following error by preventing default event.
        // `Error: Not implemented: HTMLFormElement.prototype.requestSubmit`
        onSubmit={(e) => {
          e.preventDefault()
        }}
        onFiltersChanged={() => {}}
        onSelectVehicleOption={() => {}}
      />
    )

    expect(autocompleteListbox().get()).toBeInTheDocument()

    await userEvent.click(submitButton.get())

    expect(autocompleteListbox().get()).not.toBeVisible()
  })

  test("when a autocomplete option is clicked, should fire event 'onSelectVehicleOption'", async () => {
    const onSelectVehicleOption = jest.fn()
    const inputText = "123"
    const vehicle = vehicleFactory.build()

    ;(useAutocompleteResults as jest.Mock).mockImplementation(((
      _socket,
      searchText
    ) => {
      if (inputText === searchText) {
        return {
          vehicle: [vehicle],
          operator: [],
          run: [],
        }
      }
      return {
        operator: [],
        run: [],
        vehicle: [],
      }
    }) as typeof useAutocompleteResults)

    render(
      <SearchForm
        inputText={inputText}
        filters={{
          location: false,
          operator: true,
          run: true,
          vehicle: true,
        }}
        // Prevent the following error by preventing default event.
        // `Error: Not implemented: HTMLFormElement.prototype.requestSubmit`
        onSubmit={(e) => {
          e.preventDefault()
        }}
        onFiltersChanged={() => {}}
        onSelectVehicleOption={onSelectVehicleOption}
      />
    )

    await userEvent.click(autocompleteOption(vehicle.label!).get())

    expect(onSelectVehicleOption).toHaveBeenCalledWith(vehicle)
  })

  test("when search text is updated, should show new autocomplete results", async () => {
    const [vehicle, nextVehicle] = vehicleFactory.buildList(2)

    const inputText = "123"
    const nextInputText = inputText + "456"
    const filters = {
      location: false,
      operator: true,
      run: true,
      vehicle: true,
    }
    const maxElements = 5

    ;(useAutocompleteResults as jest.Mock).mockImplementation(((
      _socket,
      searchText
    ) => {
      switch (searchText) {
        case inputText: {
          return {
            vehicle: [vehicle],
            operator: [],
            run: [],
          }
        }
        case nextInputText: {
          return {
            vehicle: [nextVehicle],
            operator: [],
            run: [],
          }
        }
        default: {
          return {
            operator: [],
            run: [],
            vehicle: [],
          }
        }
      }
    }) as typeof useAutocompleteResults)

    const { rerender } = render(
      <SearchForm
        inputText={inputText}
        filters={filters}
        // Prevent the following error by preventing default event.
        // `Error: Not implemented: HTMLFormElement.prototype.requestSubmit`
        onSubmit={(e) => {
          e.preventDefault()
        }}
        onFiltersChanged={jest.fn()}
        onSelectVehicleOption={jest.fn()}
      />
    )

    const vehicleOption = autocompleteOption(vehicle.label!)

    expect(vehicleOption.get()).toBeVisible()

    rerender(
      <SearchForm
        inputText={nextInputText}
        filters={filters}
        // Prevent the following error by preventing default event.
        // `Error: Not implemented: HTMLFormElement.prototype.requestSubmit`
        onSubmit={(e) => {
          e.preventDefault()
        }}
        onFiltersChanged={jest.fn()}
        onSelectVehicleOption={jest.fn()}
      />
    )
    expect(useAutocompleteResults).toHaveBeenNthCalledWith(
      1,
      undefined,
      inputText,
      filters,
      maxElements
    )
    expect(useAutocompleteResults).toHaveBeenNthCalledWith(
      2,
      undefined,
      nextInputText,
      filters,
      maxElements
    )
    expect(autocompleteOption(nextVehicle.label!).get()).toBeVisible()
    expect(vehicleOption.query()).not.toBeInTheDocument()
  })

  test("when a filter is applied, should not show disabled categories in autocomplete", async () => {
    const inputText = "123"
    const [vehicle, runVehicle] = vehicleFactory.buildList(2)

    ;(useAutocompleteResults as jest.Mock).mockImplementation(((
      _socket,
      searchText,
      filters
    ) => {
      if (inputText === searchText) {
        return {
          vehicle: filters.vehicle ? [vehicle] : [],
          operator: [],
          run: [runVehicle],
        }
      }
      return {
        operator: [],
        run: [],
        vehicle: [],
      }
    }) as typeof useAutocompleteResults)

    render(
      <SearchForm
        inputText={inputText}
        filters={{
          location: false,
          operator: true,
          run: true,
          vehicle: false,
        }}
        onFiltersChanged={() => {}}
        onSelectVehicleOption={() => {}}
      />
    )

    expect(autocompleteOption(vehicle.label!).query()).not.toBeInTheDocument()
    expect(autocompleteOption(runVehicle.runId!).get()).toBeInTheDocument()
  })
})
