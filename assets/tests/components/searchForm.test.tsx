import { jest, describe, test, expect } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import renderer from "react-test-renderer"
import SearchFormFromStateDispatchContext, {
  Combobox,
} from "../../src/components/searchForm"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { initialState } from "../../src/state"
import {
  SearchPageState,
  setOldSearchProperty,
  setSearchText,
  submitSearch,
} from "../../src/state/searchPageState"
import stateFactory from "../factories/applicationState"
import {
  allFilter,
  clearButton,
  locationFilter,
  operatorFilter,
  runFilter,
  searchInput,
  submitButton,
  vehicleFilter,
} from "../testHelpers/selectors/components/searchForm"
import { searchPageStateFactory } from "../factories/searchPageState"
import {
  emptySearchQueryFactory,
  searchQueryVehicleFactory,
} from "../factories/searchQuery"
import {
  listbox as autocompleteListbox,
  option as autocompleteOption,
} from "../testHelpers/selectors/components/groupedAutocomplete"
import { useAutocompleteResults } from "../../src/hooks/useAutocompleteResults"
import { vehicleFactory } from "../factories/vehicle"
import { SearchPropertyQuery } from "../../src/models/searchQuery"
import { formatOperatorName } from "../../src/util/operatorFormatting"
import locationSearchSuggestionFactory from "../factories/locationSearchSuggestion"
import { useLocationSearchSuggestions } from "../../src/hooks/useLocationSearchSuggestions"

jest.mock("../../src/hooks/useAutocompleteResults", () => ({
  useAutocompleteResults: jest.fn().mockImplementation(() => ({
    operator: [],
    run: [],
    vehicle: [],
  })),
}))

jest.mock("../../src/hooks/useLocationSearchSuggestions", () => ({
  useLocationSearchSuggestions: jest.fn().mockImplementation(() => []),
}))

const mockDispatch = jest.fn()

describe("Combobox", () => {
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
    describe("the selected property is checked by default", () => {
      const propertyToSelector = {
        all: allFilter,
        vehicle: vehicleFilter,
        operator: operatorFilter,
        run: runFilter,
        location: locationFilter,
      }
      const filters: SearchPropertyQuery[] = [
        "all",
        "vehicle",
        "operator",
        "run",
        "location",
      ]
      test.each(filters)("%s checked", (selectedProperty) => {
        const testDispatch = jest.fn()
        render(
          <StateDispatchProvider
            state={stateFactory.build({
              searchPageState: searchPageStateFactory.build({
                query: emptySearchQueryFactory.build({
                  text: "123",
                  property: selectedProperty,
                }),
              }),
            })}
            dispatch={testDispatch}
          >
            <SearchFormFromStateDispatchContext />
          </StateDispatchProvider>
        )

        expect(
          propertyToSelector[selectedProperty as SearchPropertyQuery].get()
        ).toBeChecked()
      })
    })

    test("when filter is selected, dispatches event to change search property and submit search", async () => {
      const testDispatch = jest.fn()
      render(
        <StateDispatchProvider
          state={{
            ...initialState,
            searchPageState: searchPageStateFactory.build({
              query: searchQueryVehicleFactory.build({
                text: "123",
              }),
            }),
          }}
          dispatch={testDispatch}
        >
          <SearchFormFromStateDispatchContext />
        </StateDispatchProvider>
      )

      await userEvent.click(locationFilter.get())
      expect(testDispatch).toHaveBeenCalledWith(
        setOldSearchProperty("location")
      )
      expect(testDispatch).toHaveBeenCalledWith(submitSearch())
    })
  })

  /**
   * Testing just the combobox component ###
   * Here's a wrapper with all the redundant props for a map_search combobox
   */
  const ComboboxWrapper: React.FC<{
    inputText?: string
    property?: "all" | "run"
    onSubmit?: React.ReactEventHandler<Element>
  }> = ({ inputText, property, onSubmit }) => {
    const testDispatch = jest.fn()
    const query = emptySearchQueryFactory.build({
      text: "123",
      property: property || "all",
    })

    return (
      <Combobox
        inputText={inputText || "123"}
        onSubmit={onSubmit}
        comboboxType="map_search"
        dispatch={testDispatch}
        query={query}
      />
    )
  }

  test("when the search text length is greater than or equal to the minium character count, should show autocomplete", () => {
    render(<ComboboxWrapper />)

    expect(autocompleteListbox().get()).toBeInTheDocument()
  })

  test("when the search text length is less than the minium character count, should not show autocomplete", () => {
    render(<ComboboxWrapper inputText="12" />)

    expect(autocompleteListbox().get()).not.toBeVisible()
  })

  test("when the search is submitted, should not show autocomplete", async () => {
    render(
      <ComboboxWrapper
        // Prevent the following error by preventing default event.
        // `Error: Not implemented: HTMLFormElement.prototype.requestSubmit`
        onSubmit={(e) => {
          e.preventDefault()
        }}
      />
    )

    expect(autocompleteListbox().get()).toBeInTheDocument()

    await userEvent.click(submitButton.get())

    expect(autocompleteListbox().get()).not.toBeVisible()
  })

  test("when a text-only location autocomplete option is clicked, should close autocomplete", async () => {
    const inputText = "123 Test St"
    const locationSuggestion = locationSearchSuggestionFactory.build({
      text: "Suggested Search Term",
      placeId: null,
    })

    jest
      .mocked(useLocationSearchSuggestions)
      .mockReturnValue([locationSuggestion])

    render(
      <ComboboxWrapper
        inputText={inputText}
        property="all"
        // Prevent the following error by preventing default event.
        // `Error: Not implemented: HTMLFormElement.prototype.requestSubmit`
        onSubmit={(e) => {
          e.preventDefault()
        }}
      />
    )
    expect(autocompleteListbox().get()).toBeVisible()
    await userEvent.click(autocompleteOption(locationSuggestion.text).get())
    expect(autocompleteListbox().get()).not.toBeVisible()
  })

  test("when a filter is applied, should not show disabled categories in autocomplete", async () => {
    const inputText = "123"
    const [vehicle, runVehicle] = vehicleFactory.buildList(2)

    jest.mocked(useAutocompleteResults).mockImplementation(((
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

    render(<ComboboxWrapper inputText={inputText} property="run" />)

    expect(autocompleteOption(vehicle.label!).query()).not.toBeInTheDocument()
    expect(autocompleteOption(runVehicle.runId!).get()).toBeInTheDocument()
  })

  test("when all property selected, should show all categories in autocomplete", async () => {
    const inputText = "123"
    const [vehicle, runVehicle, operatorVehicle] = vehicleFactory.buildList(3)

    jest.mocked(useAutocompleteResults).mockImplementation(((
      _socket,
      searchText
    ) => {
      if (inputText === searchText) {
        return {
          vehicle: [vehicle],
          operator: [operatorVehicle],
          run: [runVehicle],
        }
      }
      return {
        operator: [],
        run: [],
        vehicle: [],
      }
    }) as typeof useAutocompleteResults)

    render(<ComboboxWrapper inputText={inputText} property="all" />)

    expect(autocompleteOption(vehicle.label!).query()).toBeInTheDocument()
    expect(
      autocompleteOption(
        formatOperatorName(
          operatorVehicle.operatorFirstName,
          operatorVehicle.operatorLastName,
          operatorVehicle.operatorId
        )
      ).query()
    ).toBeInTheDocument()

    expect(autocompleteOption(runVehicle.runId!).get()).toBeInTheDocument()
  })
})
