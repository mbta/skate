import { jest, describe, test, expect } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import { getAllByRole, render, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React, { MutableRefObject } from "react"
import { act } from "react-dom/test-utils"

import {
  CursorExitDirection,
  GroupedAutocomplete,
  GroupedAutocompleteControls,
  GroupedAutocompleteFromSearchTextResults,
  autocompleteGroup,
  autocompleteOption,
} from "../../src/components/groupedAutocomplete"
import { useAutocompleteResults } from "../../src/hooks/useAutocompleteResults"
import {
  SearchProperties,
  searchPropertyDisplayConfig,
} from "../../src/models/searchQuery"
import { vehicleFactory } from "../factories/vehicle"
import { formatOperatorNameFromVehicle } from "../../src/util/operatorFormatting"
import {
  listbox,
  optionGroup,
  option,
} from "../testHelpers/selectors/components/groupedAutocomplete"
import { searchFiltersFactory } from "../factories/searchProperties"
import { useLocationSearchSuggestions } from "../../src/hooks/useLocationSearchSuggestions"
import locationSearchSuggestionFactory from "../factories/locationSearchSuggestion"
import locationSearchResultFactory from "../factories/locationSearchResult"

jest.mock("../../src/hooks/useAutocompleteResults", () => ({
  useAutocompleteResults: jest
    .fn<typeof useAutocompleteResults>()
    .mockImplementation(() => ({
      operator: [],
      run: [],
      vehicle: [],
    })),
}))

jest.mock("../../src/hooks/useLocationSearchSuggestions", () => ({
  useLocationSearchSuggestions: jest.fn().mockImplementation(() => []),
}))

describe("<GroupedAutocomplete/>", () => {
  test("when rendered, should show results", () => {
    const onSelectOption = jest.fn()

    const group1Title = "Group 1"
    const group2Title = "Group 2"
    const group3Title = "Group 3"
    const option1Label = "Option 1"
    const option4Label = "Option 4"
    const option9Label = "Option 9"

    render(
      <GroupedAutocomplete
        controlName="Autocomplete List"
        fallbackOption={autocompleteOption(null)}
        optionGroups={[
          autocompleteGroup(
            <h1>{group1Title}</h1>,
            autocompleteOption(option1Label, onSelectOption),
            autocompleteOption(<div>Option 2</div>, onSelectOption),
            autocompleteOption(<em>Option 3</em>, onSelectOption)
          ),

          autocompleteGroup(
            <h1>{group2Title}</h1>,
            autocompleteOption(option4Label, onSelectOption)
          ),

          autocompleteGroup(
            <h1>{group3Title}</h1>,
            autocompleteOption("Option 5", onSelectOption),
            autocompleteOption("Option 6", onSelectOption),
            autocompleteOption("Option 7", onSelectOption),
            autocompleteOption("Option 8", onSelectOption),
            autocompleteOption(<label>{option9Label}</label>, onSelectOption)
          ),
        ]}
      />
    )

    // Render form and autocomplete results

    const autocompleteResults = listbox("Autocomplete List").get()
    expect(getAllByRole(autocompleteResults, "group")).toHaveLength(3)

    const group1Results = optionGroup(group1Title).get()
    const group2Results = optionGroup(group2Title).get()
    const group3Results = optionGroup(group3Title).get()

    expect(option(option1Label).get(group1Results)).toBeInTheDocument()

    expect(option(option4Label).get(group2Results)).toBeInTheDocument()

    expect(option(option9Label).get(group3Results)).toBeInTheDocument()
  })

  test("when rerendered with new options, should show new options", () => {
    const persistentGroupTitle = "Group 1"
    const firstRenderGroup2Title = "Group 2.1"
    const secondRenderGroup2Title = "Group 2.2"

    const option1Label = "Option 1"
    const option2Label = "Option 2"
    const option3Label = "Option 3"
    const option4Label = "Option 4"

    const { rerender } = render(
      <GroupedAutocomplete
        controlName="Autocomplete List"
        fallbackOption={autocompleteOption(null)}
        optionGroups={[
          autocompleteGroup(
            persistentGroupTitle,
            autocompleteOption(option1Label),
            autocompleteOption(option2Label)
          ),
          autocompleteGroup(
            firstRenderGroup2Title,
            autocompleteOption(option1Label),
            autocompleteOption(option2Label)
          ),
        ]}
      />
    )

    const persistentGroup = optionGroup(persistentGroupTitle).get()
    const option1Selector = option(option1Label)
    const option2Selector = option(option2Label)
    const option3Selector = option(option3Label)
    const option4Selector = option(option4Label)

    expect(option1Selector.get(persistentGroup)).toBeInTheDocument()
    expect(option2Selector.get(persistentGroup)).toBeInTheDocument()

    expect(
      option1Selector.get(optionGroup(firstRenderGroup2Title).get())
    ).toBeInTheDocument()
    expect(
      option2Selector.get(optionGroup(firstRenderGroup2Title).get())
    ).toBeInTheDocument()

    rerender(
      <GroupedAutocomplete
        controlName="Autocomplete List"
        fallbackOption={autocompleteOption(null)}
        optionGroups={[
          autocompleteGroup(
            persistentGroupTitle,
            autocompleteOption(option3Label),
            autocompleteOption(option4Label)
          ),
          autocompleteGroup(
            secondRenderGroup2Title,
            autocompleteOption(option2Label),
            autocompleteOption(option4Label)
          ),
        ]}
      />
    )

    expect(option3Selector.get(persistentGroup)).toBeInTheDocument()
    expect(option4Selector.get(persistentGroup)).toBeInTheDocument()

    expect(
      option2Selector.get(optionGroup(secondRenderGroup2Title).get())
    ).toBeInTheDocument()
    expect(
      option4Selector.get(optionGroup(secondRenderGroup2Title).get())
    ).toBeInTheDocument()
  })

  test("when rendered with an empty list of groups, should show fallback option", async () => {
    const fallbackLabel = "Fallback Option"

    render(
      <GroupedAutocomplete
        controlName="Search Suggestions"
        fallbackOption={autocompleteOption(fallbackLabel)}
        optionGroups={[]}
      />
    )

    expect(option(fallbackLabel).get(listbox().get())).toBeInTheDocument()
  })

  test("when autocomplete is focused, should move cursor and focus to first result", async () => {
    const onSelectOption = jest.fn()

    const option1Label = "Option 1"

    render(
      <GroupedAutocomplete
        controlName="Search Suggestions"
        fallbackOption={autocompleteOption(null)}
        optionGroups={[
          autocompleteGroup(
            null,
            autocompleteOption(option1Label, onSelectOption)
          ),
        ]}
      />
    )

    const autocomplete = listbox().get()

    act(() => {
      autocomplete.focus()
    })

    await waitFor(() =>
      expect(option(option1Label).get(autocomplete)).toHaveFocus()
    )
  })

  test("when there are no results and autocomplete is focused, should move cursor and focus to fallback option", async () => {
    const fallbackOptionLabel = "Option 1"

    render(
      <GroupedAutocomplete
        controlName="Search Suggestions"
        fallbackOption={autocompleteOption(fallbackOptionLabel)}
        optionGroups={[]}
      />
    )

    const autocomplete = listbox().get()

    act(() => {
      autocomplete.focus()
    })

    await waitFor(() =>
      expect(option(fallbackOptionLabel).get(autocomplete)).toHaveFocus()
    )
  })

  describe("when down arrow is pressed, should select next result", () => {
    test("in same group", async () => {
      const onSelectOption = jest.fn()
      const group1Title = "Group 1"
      const option1Label = "Option 1"
      const option2Label = "Option 2"

      render(
        <GroupedAutocomplete
          controlName="Search Suggestions"
          fallbackOption={autocompleteOption(null)}
          optionGroups={[
            autocompleteGroup(
              group1Title,
              autocompleteOption(option1Label, onSelectOption),
              autocompleteOption(option2Label, onSelectOption)
            ),
          ]}
        />
      )

      const option1 = option(option1Label).get()
      const option2 = option(option2Label).get()

      act(() => option1.focus())

      await userEvent.keyboard("{ArrowDown}")

      expect(option2).toHaveFocus()
    })

    test("in next group", async () => {
      const onSelectOption = jest.fn()
      const option1Label = "Option 1"
      const option2Label = "Option 2"

      const group1Title = "Group 1"
      const group2Title = "Group 2"
      render(
        <GroupedAutocomplete
          controlName="Search Suggestions"
          fallbackOption={autocompleteOption(null)}
          optionGroups={[
            autocompleteGroup(
              group1Title,
              autocompleteOption(option1Label, onSelectOption)
            ),
            autocompleteGroup(
              group2Title,
              autocompleteOption(option2Label, onSelectOption)
            ),
          ]}
        />
      )

      const group1 = optionGroup(group1Title).get()
      const group2 = optionGroup(group2Title).get()

      const option1 = option(option1Label).get(group1)
      const option2 = option(option2Label).get(group2)

      act(() => {
        option1.focus()
      })

      await userEvent.keyboard("{ArrowDown}")

      await waitFor(() => expect(option2).toHaveFocus())
    })
  })

  describe("when up arrow is pressed, should select previous result", () => {
    test("in same group", async () => {
      const onSelectOption = jest.fn()
      const group1Title = "Group 1"
      const option1Label = "Option 1"
      const option2Label = "Option 2"

      render(
        <GroupedAutocomplete
          controlName="Search Suggestions"
          fallbackOption={autocompleteOption(null)}
          optionGroups={[
            autocompleteGroup(
              group1Title,
              autocompleteOption(option1Label, onSelectOption),
              autocompleteOption(option2Label, onSelectOption)
            ),
          ]}
        />
      )

      const option1 = option(option1Label).get()
      const option2 = option(option2Label).get()

      act(() => option2.focus())

      await userEvent.keyboard("{ArrowUp}")

      expect(option1).toHaveFocus()
    })

    test("in next group", async () => {
      const onSelectOption = jest.fn()
      const option1Label = "Option 1"
      const option2Label = "Option 2"

      const group1Title = "Group 1"
      const group2Title = "Group 2"
      render(
        <GroupedAutocomplete
          controlName="Search Suggestions"
          fallbackOption={autocompleteOption(null)}
          optionGroups={[
            autocompleteGroup(
              group1Title,
              autocompleteOption(option1Label, onSelectOption)
            ),
            autocompleteGroup(
              group2Title,
              autocompleteOption(option2Label, onSelectOption)
            ),
          ]}
        />
      )

      const group1 = optionGroup(group1Title).get()
      const group2 = optionGroup(group2Title).get()

      const option1 = option(option1Label).get(group1)
      const option2 = option(option2Label).get(group2)

      act(() => {
        option2.focus()
      })
      await userEvent.keyboard("{ArrowUp}")

      await waitFor(() => expect(option1).toHaveFocus())
    })
  })

  test("when home is pressed, should select first result", async () => {
    const onSelectOption = jest.fn()
    const option1Label = "Option 1"
    const option2Label = "Option 2"

    const group1Title = "Group 1"
    const group2Title = "Group 2"
    render(
      <GroupedAutocomplete
        controlName="Search Suggestions"
        fallbackOption={autocompleteOption(null)}
        optionGroups={[
          autocompleteGroup(
            group1Title,
            autocompleteOption(option1Label, onSelectOption),
            autocompleteOption("Unrelated Option", onSelectOption)
          ),
          autocompleteGroup(
            group2Title,
            autocompleteOption(option2Label, onSelectOption)
          ),
        ]}
      />
    )

    const group1 = optionGroup(group1Title).get()
    const group2 = optionGroup(group2Title).get()

    const option1 = option(option1Label).get(group1)
    const option2 = option(option2Label).get(group2)

    act(() => {
      option2.focus()
    })
    await userEvent.keyboard("{Home}")

    await waitFor(() => expect(option1).toHaveFocus())
  })

  test("when end is pressed, should select last result", async () => {
    const onSelectOption = jest.fn()
    const firstOptionLabel = "Option First"
    const lastOptionLabel = "Option Last"

    const group1Title = "Group 1"
    const group2Title = "Group 2"
    render(
      <GroupedAutocomplete
        controlName="Search Suggestions"
        fallbackOption={autocompleteOption(null)}
        optionGroups={[
          autocompleteGroup(
            group1Title,
            autocompleteOption(firstOptionLabel, onSelectOption),
            autocompleteOption("Unrelated Option", onSelectOption)
          ),

          autocompleteGroup(
            group2Title,
            autocompleteOption(lastOptionLabel, onSelectOption)
          ),
        ]}
      />
    )

    const group1 = optionGroup(group1Title).get()
    const group2 = optionGroup(group2Title).get()

    const firstOption = option(firstOptionLabel).get(group1)
    const lastOption = option(lastOptionLabel).get(group2)

    act(() => {
      firstOption.focus()
    })
    await userEvent.keyboard("{End}")

    await waitFor(() => expect(lastOption).toHaveFocus())
  })

  describe("should fire event `onSelectOption`", () => {
    test("when enter is pressed", async () => {
      const onSelectOption = jest.fn()
      const optionLabel = "Option Label"

      render(
        <GroupedAutocomplete
          controlName="Search Suggestions"
          fallbackOption={autocompleteOption(null)}
          optionGroups={[
            autocompleteGroup(
              null,
              autocompleteOption(optionLabel, onSelectOption)
            ),
          ]}
        />
      )

      const btn = option(optionLabel).get(listbox().get())

      await userEvent.type(btn, "{Enter}")

      await waitFor(() => {
        expect(onSelectOption).toHaveBeenCalled()
      })
    })

    test("when item is clicked", async () => {
      const onSelectOption = jest.fn()
      const [idVehicle] = vehicleFactory.buildList(1)

      render(
        <GroupedAutocomplete
          controlName="Search Suggestions"
          fallbackOption={autocompleteOption(null)}
          optionGroups={[
            autocompleteGroup(
              null,
              autocompleteOption(idVehicle.label!, onSelectOption)
            ),
          ]}
        />
      )

      const btn = option(idVehicle.label!).get(listbox().get())

      await userEvent.click(btn)

      expect(onSelectOption).toHaveBeenCalled()
    })
  })

  test("when fallback option is clicked, should fire `onSelectFallbackOption`", async () => {
    const onSelectFallbackOption = jest.fn()
    const fallbackLabel = "Fallback Option"

    render(
      <GroupedAutocomplete
        controlName="Search Suggestions"
        fallbackOption={autocompleteOption(
          fallbackLabel,
          onSelectFallbackOption
        )}
        optionGroups={[]}
      />
    )

    await userEvent.click(option(fallbackLabel).get())

    expect(onSelectFallbackOption).toHaveBeenCalledTimes(1)
  })

  test("when controller function `focusCursorToFirstOption` is called, should move cursor and focus to first option", () => {
    const onSelectOption = jest.fn()
    const option1Label = "Option 1"

    const controller: MutableRefObject<GroupedAutocompleteControls | null> = {
      current: null,
    }
    render(
      <GroupedAutocomplete
        controllerRef={controller}
        controlName="Search Suggestions"
        fallbackOption={autocompleteOption(null)}
        optionGroups={[
          autocompleteGroup(
            null,
            autocompleteOption(option1Label, onSelectOption),
            autocompleteOption("Option 2", onSelectOption)
          ),
        ]}
      />
    )

    act(() => {
      controller.current?.focusCursorToFirstOption()
    })

    expect(option(option1Label).get()).toHaveFocus()
  })

  test.each([
    {
      key: "{ArrowDown}",
      expectedDirection: CursorExitDirection.ExitEnd,
    },
    {
      key: "{ArrowUp}",
      expectedDirection: CursorExitDirection.ExitStart,
    },
  ])(
    "when user presses `$key` to move out of the listbox, should fire `onCursorExitEdge($expectedDirection)` and focus should remain on last selected element",
    async ({ key, expectedDirection }) => {
      const onCursorExitEdge = jest.fn()
      const option1Label = "option1Label"
      const option2Label = "option2Label"

      const targetOptionLabel =
        expectedDirection === CursorExitDirection.ExitStart
          ? option1Label
          : option2Label

      render(
        <GroupedAutocomplete
          controlName=""
          fallbackOption={autocompleteOption(null)}
          optionGroups={[
            autocompleteGroup(
              null,
              autocompleteOption(option1Label),
              autocompleteOption(option2Label)
            ),
          ]}
          onCursor={{
            onCursorExitEdge,
          }}
        />
      )

      const targetOption = option(targetOptionLabel).get()

      act(() => {
        targetOption.focus()
      })

      expect(targetOption).toHaveFocus()

      await userEvent.keyboard(key)

      expect(targetOption).toHaveFocus()

      expect(onCursorExitEdge).toHaveBeenCalledWith(expectedDirection)
    }
  )
})

describe("<GroupedAutocompleteFromSearchTextResults/>", () => {
  const vehiclesResultsGroup = optionGroup(
    searchPropertyDisplayConfig.vehicle.name
  )
  const runResultsGroup = optionGroup(searchPropertyDisplayConfig.run.name)
  const operatorsResultsGroup = optionGroup(
    searchPropertyDisplayConfig.operator.name
  )
  const locationResultsGroup = optionGroup(
    searchPropertyDisplayConfig.location.name
  )

  test("when rendered, should show results", () => {
    const searchText = "12345"
    const [idVehicle, runVehicle, operatorVehicle] = vehicleFactory.buildList(3)
    const locationSuggestion = locationSearchSuggestionFactory.build()

    jest.mocked(useAutocompleteResults).mockImplementation(
      (_socket, text: string, _filters) =>
        ({
          [searchText]: {
            vehicle: [idVehicle],
            operator: [operatorVehicle],
            run: [runVehicle],
          },
        }[text] || {
          vehicle: [],
          operator: [],
          run: [],
        })
    )
    jest
      .mocked(useLocationSearchSuggestions)
      .mockImplementation(() => [locationSuggestion])

    render(
      <GroupedAutocompleteFromSearchTextResults
        controlName="Search Suggestions"
        fallbackOption={autocompleteOption(null)}
        onSelectVehicleOption={() => {}}
        searchText={searchText}
        searchFilters={searchFiltersFactory.build()}
        onSelectedLocationId={() => {}}
        onSelectedLocationText={() => {}}
      />
    )

    // Render form and autocomplete results
    const autocompleteResults = listbox().get()
    expect(getAllByRole(autocompleteResults, "group")).toHaveLength(4)

    const vehiclesResults = vehiclesResultsGroup.get()
    const runResults = runResultsGroup.get()
    const operatorsResults = operatorsResultsGroup.get()
    const locationResults = locationResultsGroup.get()

    expect(option(idVehicle.label!).get(vehiclesResults)).toBeInTheDocument()

    expect(option(runVehicle.runId!).get(runResults)).toBeInTheDocument()

    expect(
      option(formatOperatorNameFromVehicle(operatorVehicle)).get(
        operatorsResults
      )
    ).toBeInTheDocument()

    expect(
      option(locationSuggestion.text).get(locationResults)
    ).toBeInTheDocument()
  })

  test("when rendered, should not show more than `maxElementsPerGroup` results", () => {
    const searchText = "12345"
    const maxLength = 5

    jest.mocked(useAutocompleteResults).mockImplementation(
      (_socket, text: string, _) =>
        ({
          [searchText]: {
            vehicle: vehicleFactory.buildList(maxLength + 2),
            operator: [],
            run: [],
          },
        }[text] || {
          vehicle: [],
          operator: [],
          run: [],
        })
    )
    jest
      .mocked(useLocationSearchSuggestions)
      .mockImplementation(() =>
        locationSearchSuggestionFactory.buildList(maxLength + 2)
      )

    render(
      <GroupedAutocompleteFromSearchTextResults
        controlName="Search Suggestions"
        maxElementsPerGroup={maxLength}
        fallbackOption={autocompleteOption(null)}
        onSelectVehicleOption={() => {}}
        searchText={searchText}
        searchFilters={searchFiltersFactory.build()}
        onSelectedLocationId={() => {}}
        onSelectedLocationText={() => {}}
      />
    )

    // Render form and autocomplete results
    const autocompleteResults = listbox().get()
    expect(getAllByRole(autocompleteResults, "group")).toHaveLength(2)

    const vehiclesResults = vehiclesResultsGroup.get()

    expect(vehiclesResults.children).toHaveLength(maxLength)

    const locationResults = locationResultsGroup.get()

    expect(locationResults.children).toHaveLength(maxLength)
  })

  test("when searchText changes, should show new results", () => {
    const inputText = "12345"
    const updatedInputText = inputText + "123"

    const [vehicle, nextVehicle] = vehicleFactory.buildList(2)

    jest
      .mocked(useAutocompleteResults)
      .mockImplementation((_socket, searchText) => {
        switch (searchText) {
          case inputText: {
            return {
              vehicle: [vehicle],
              operator: [],
              run: [],
            }
          }
          case updatedInputText: {
            return {
              vehicle: [],
              operator: [],
              run: [nextVehicle],
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
      })

    // Autocomplete results from search
    const Autocomplete = ({ searchText }: { searchText: string }) => (
      <GroupedAutocompleteFromSearchTextResults
        controlName=""
        fallbackOption={autocompleteOption(null)}
        onSelectVehicleOption={() => {}}
        searchText={searchText}
        searchFilters={searchFiltersFactory.build()}
        onSelectedLocationId={() => {}}
        onSelectedLocationText={() => {}}
      />
    )
    const { rerender } = render(<Autocomplete searchText={inputText} />)

    const vehiclesGroup = vehiclesResultsGroup.get()

    const option1 = option(vehicle.label!)
    const option2 = option(nextVehicle.runId!)

    expect(option1.get(vehiclesGroup)).toBeInTheDocument()
    expect(option2.query()).not.toBeInTheDocument()

    // Update search
    rerender(<Autocomplete searchText={updatedInputText} />)

    const runResults = runResultsGroup.get()

    expect(option2.get(runResults)).toBeInTheDocument()
    expect(option1.query()).not.toBeInTheDocument()
  })

  test("when showing results, should not show a category if there are no results", () => {
    const [vehicle, runVehicle] = vehicleFactory.buildList(2)

    jest.mocked(useAutocompleteResults).mockReturnValue({
      vehicle: [vehicle],
      operator: [],
      run: [runVehicle],
    })

    const Autocomplete = () => (
      <GroupedAutocompleteFromSearchTextResults
        controlName=""
        fallbackOption={autocompleteOption(null)}
        onSelectVehicleOption={() => {}}
        searchText={""}
        searchFilters={searchFiltersFactory.build()}
        onSelectedLocationId={() => {}}
        onSelectedLocationText={() => {}}
      />
    )
    const { rerender } = render(<Autocomplete />)

    const vehicleOptions = vehiclesResultsGroup.get()
    const runOptions = runResultsGroup.get()

    const vehicleOption = option(vehicle.label!)
    const runOption = option(runVehicle.runId!)

    expect(vehicleOption.get(vehicleOptions)).toBeInTheDocument()
    expect(runOption.get(runOptions)).toBeInTheDocument()
    jest.mocked(useAutocompleteResults).mockImplementation(() => {
      return {
        vehicle: [vehicle],
        operator: [],
        run: [],
      }
    })
    rerender(<Autocomplete />)

    expect(vehicleOption.get(vehicleOptions)).toBeInTheDocument()

    expect(runOption.query()).not.toBeInTheDocument()
  })

  test("when supplied with search filters, should not show disabled categories", () => {
    const [vehicle, runVehicle] = vehicleFactory.buildList(2)

    jest
      .mocked(useAutocompleteResults)
      .mockImplementation((_socket, _searchText, filters) => {
        return {
          vehicle: filters.vehicle ? [vehicle] : [],
          operator: [],
          run: filters.run ? [runVehicle] : [],
        }
      })

    const Autocomplete = ({
      filters,
    }: {
      filters: SearchProperties<boolean>
    }) => (
      <GroupedAutocompleteFromSearchTextResults
        controlName=""
        fallbackOption={autocompleteOption(null)}
        onSelectVehicleOption={() => {}}
        searchText={""}
        searchFilters={filters}
        onSelectedLocationId={() => {}}
        onSelectedLocationText={() => {}}
      />
    )
    const { rerender } = render(
      <Autocomplete filters={searchFiltersFactory.build()} />
    )

    const vehicleOptions = vehiclesResultsGroup.get()
    const runOptions = runResultsGroup.get()

    const vehicleOption = option(vehicle.label!)
    const runOption = option(runVehicle.runId!)

    expect(vehicleOption.get(vehicleOptions)).toBeInTheDocument()
    expect(runOption.get(runOptions)).toBeInTheDocument()

    rerender(
      <Autocomplete filters={searchFiltersFactory.build({ run: false })} />
    )

    expect(vehicleOption.get(vehicleOptions)).toBeInTheDocument()
    expect(runOption.query()).not.toBeInTheDocument()
  })

  test("when an autocomplete option is clicked, should fire event 'onSelectVehicleOption'", async () => {
    const onSelectVehicleOption = jest.fn()
    const searchText = "123"
    const vehicle = vehicleFactory.build()

    jest
      .mocked(useAutocompleteResults)
      .mockImplementation((_socket, searchText) => {
        if (searchText === searchText) {
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
      })

    render(
      <GroupedAutocompleteFromSearchTextResults
        controlName="Search Suggestions"
        fallbackOption={autocompleteOption(null)}
        onSelectVehicleOption={onSelectVehicleOption}
        searchText={searchText}
        searchFilters={searchFiltersFactory.build()}
        onSelectedLocationId={() => {}}
        onSelectedLocationText={() => {}}
      />
    )

    await userEvent.click(option(vehicle.label!).get())

    expect(onSelectVehicleOption).toHaveBeenCalledWith(vehicle)
  })

  test("when a location autocomplete option is clicked, should fire event 'onSelectedLocationId'", async () => {
    const onSelectLocationId = jest.fn()
    const searchText = "123 Test St"
    const location = locationSearchResultFactory.build({
      name: "Search Suggestion",
    })
    const locationSuggestion = locationSearchSuggestionFactory.build({
      text: location.name!,
      placeId: location.id,
    })

    jest
      .mocked(useLocationSearchSuggestions)
      .mockReturnValue([locationSuggestion])

    render(
      <GroupedAutocompleteFromSearchTextResults
        controlName="Search Suggestions"
        fallbackOption={autocompleteOption(null)}
        onSelectVehicleOption={() => {}}
        searchText={searchText}
        searchFilters={searchFiltersFactory.build()}
        onSelectedLocationId={onSelectLocationId}
        onSelectedLocationText={() => {}}
      />
    )

    await userEvent.click(option(location.name!).get())

    expect(onSelectLocationId).toHaveBeenCalledWith(location.id)
  })

  test("when a text-only location autocomplete option is clicked, should fire event 'onSelectedLocationText'", async () => {
    const onSelectLocationText = jest.fn()
    const searchText = "123 Test St"
    const locationSuggestion = locationSearchSuggestionFactory.build({
      text: "Suggested Search Term",
      placeId: null,
    })

    jest
      .mocked(useLocationSearchSuggestions)
      .mockReturnValue([locationSuggestion])

    render(
      <GroupedAutocompleteFromSearchTextResults
        controlName="Search Suggestions"
        fallbackOption={autocompleteOption(null)}
        onSelectVehicleOption={() => {}}
        searchText={searchText}
        searchFilters={searchFiltersFactory.build()}
        onSelectedLocationId={() => {}}
        onSelectedLocationText={onSelectLocationText}
      />
    )

    await userEvent.click(option(locationSuggestion.text).get())

    expect(onSelectLocationText).toHaveBeenCalledWith(locationSuggestion.text)
  })
})
