import "@testing-library/jest-dom"
import { getAllByRole, render, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React, { MutableRefObject } from "react"
import { act } from "react-dom/test-utils"

import {
  GroupedAutocomplete,
  GroupedAutocompleteControls,
  GroupedAutocompleteFromSearchTextResults,
} from "../../src/components/groupedAutocomplete"
import { useAutocompleteResults } from "../../src/hooks/useAutocompleteResults"
import { searchPropertyDisplayConfig } from "../../src/models/searchQuery"
import vehicleFactory from "../factories/vehicle"
import { formatOperatorNameFromVehicle } from "../../src/util/operatorFormatting"
import {
  listbox,
  optionGroup,
  option,
} from "../testHelpers/selectors/components/groupedAutocomplete"

jest.mock("../../src/hooks/useAutocompleteResults", () => ({
  useAutocompleteResults: jest.fn().mockImplementation(() => ({
    operator: [],
    run: [],
    vehicle: [],
  })),
}))

// FIXME: make accessible https://adamsilver.io/blog/building-an-accessible-autocomplete-control/

describe("<SearchAutocomplete/>", () => {
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
        fallbackOption={null}
        groups={[
          {
            group: {
              title: <h1>{group1Title}</h1>,
              options: [
                {
                  option: {
                    label: option1Label,
                    onSelectOption,
                  },
                },
                {
                  option: {
                    label: <div>Option 2</div>,
                    onSelectOption,
                  },
                },
                {
                  option: {
                    label: <em>Option 3</em>,
                    onSelectOption,
                  },
                },
              ],
            },
          },
          {
            group: {
              title: <h1>{group2Title}</h1>,
              options: [
                {
                  option: {
                    label: option4Label,
                    onSelectOption,
                  },
                },
              ],
            },
          },
          {
            group: {
              title: <h1>{group3Title}</h1>,
              options: [
                {
                  option: {
                    label: "Option 5",
                    onSelectOption,
                  },
                },
                {
                  option: {
                    label: "Option 6",
                    onSelectOption,
                  },
                },
                {
                  option: {
                    label: "Option 7",
                    onSelectOption,
                  },
                },
                {
                  option: {
                    label: "Option 8",
                    onSelectOption,
                  },
                },
                {
                  option: {
                    label: <label>{option9Label}</label>,
                    onSelectOption,
                  },
                },
              ],
            },
          },
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

  test("when rendered with an empty list of groups, should show fallback option", async () => {
    const fallbackLabel = "Fallback Option"

    render(
      <GroupedAutocomplete
        controlName="Search Suggestions"
        fallbackOption={fallbackLabel}
        groups={[]}
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
        fallbackOption={null}
        groups={[
          {
            group: {
              title: null,
              options: [
                {
                  option: {
                    label: option1Label,
                    onSelectOption,
                  },
                },
              ],
            },
          },
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

  test.todo(
    "when a user focuses autocomplete option {} and then presses {}, should move cursor to the {} result"
  )

  test("when there are no results and autocomplete is focused, should move cursor and focus to fallback option", async () => {
    const fallbackOptionLabel = "Option 1"

    render(
      <GroupedAutocomplete
        controlName="Search Suggestions"
        fallbackOption={fallbackOptionLabel}
        groups={[]}
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
          fallbackOption={null}
          groups={[
            {
              group: {
                title: group1Title,
                options: [
                  {
                    option: {
                      label: option1Label,
                      onSelectOption,
                    },
                  },
                  {
                    option: {
                      label: option2Label,
                      onSelectOption,
                    },
                  },
                ],
              },
            },
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
          fallbackOption={null}
          groups={[
            {
              group: {
                title: group1Title,
                options: [
                  {
                    option: {
                      label: option1Label,
                      onSelectOption,
                    },
                  },
                ],
              },
            },
            {
              group: {
                title: group2Title,
                options: [
                  {
                    option: {
                      label: option2Label,
                      onSelectOption,
                    },
                  },
                ],
              },
            },
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
          fallbackOption={null}
          groups={[
            {
              group: {
                title: group1Title,
                options: [
                  {
                    option: {
                      label: option1Label,
                      onSelectOption,
                    },
                  },
                  {
                    option: {
                      label: option2Label,
                      onSelectOption,
                    },
                  },
                ],
              },
            },
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
          fallbackOption={null}
          groups={[
            {
              group: {
                title: group1Title,
                options: [
                  {
                    option: {
                      label: option1Label,
                      onSelectOption,
                    },
                  },
                ],
              },
            },
            {
              group: {
                title: group2Title,
                options: [
                  {
                    option: {
                      label: option2Label,
                      onSelectOption,
                    },
                  },
                ],
              },
            },
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
        fallbackOption={null}
        groups={[
          {
            group: {
              title: group1Title,
              options: [
                {
                  option: {
                    label: option1Label,
                    onSelectOption,
                  },
                },
                {
                  option: {
                    label: "Unrelated Option",
                    onSelectOption,
                  },
                },
              ],
            },
          },
          {
            group: {
              title: group2Title,
              options: [
                {
                  option: {
                    label: option2Label,
                    onSelectOption,
                  },
                },
              ],
            },
          },
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
        fallbackOption={null}
        groups={[
          {
            group: {
              title: group1Title,
              options: [
                {
                  option: {
                    label: firstOptionLabel,
                    onSelectOption,
                  },
                },
                {
                  option: {
                    label: "Unrelated Option",
                    onSelectOption,
                  },
                },
              ],
            },
          },
          {
            group: {
              title: group2Title,
              options: [
                {
                  option: {
                    label: lastOptionLabel,
                    onSelectOption,
                  },
                },
              ],
            },
          },
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
          fallbackOption={null}
          groups={[
            {
              group: {
                title: null,
                options: [
                  {
                    option: {
                      label: optionLabel,
                      onSelectOption,
                    },
                  },
                ],
              },
            },
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
          fallbackOption={null}
          groups={[
            {
              group: {
                title: null,
                options: [
                  {
                    option: {
                      label: idVehicle.label!,
                      onSelectOption,
                    },
                  },
                ],
              },
            },
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
        fallbackOption={fallbackLabel}
        onSelectFallbackOption={onSelectFallbackOption}
        groups={[]}
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
        fallbackOption={null}
        groups={[
          {
            group: {
              title: null,
              options: [
                {
                  option: {
                    label: option1Label,
                    onSelectOption,
                  },
                },
                {
                  option: {
                    label: "Option 2",
                    onSelectOption,
                  },
                },
              ],
            },
          },
        ]}
      />
    )

    act(() => {
      controller.current?.focusCursorToFirstOption()
    })

    expect(option(option1Label).get()).toHaveFocus()
  })
})

describe("<SearchAutocomplete.FromHook/>", () => {
  const vehiclesResultsGroup = optionGroup(
    searchPropertyDisplayConfig.vehicle.name
  )
  const runResultsGroup = optionGroup(searchPropertyDisplayConfig.run.name)
  const operatorsResultsGroup = optionGroup(
    searchPropertyDisplayConfig.operator.name
  )

  test("when rendered, should show results", () => {
    const searchText = "12345"
    const [idVehicle, runVehicle, operatorVehicle] = vehicleFactory.buildList(3)

    ;(useAutocompleteResults as jest.Mock).mockImplementation(
      (text: string, _) =>
        ({
          [searchText]: {
            vehicle: [idVehicle],
            operator: [operatorVehicle],
            run: [runVehicle],
          },
        }[text] || {})
    )

    render(
      <GroupedAutocompleteFromSearchTextResults
        controlName="Search Suggestions"
        fallbackOption={null}
        onSelectVehicleOption={() => {}}
        searchText={searchText}
        searchFilters={{
          location: false,
          operator: true,
          run: true,
          vehicle: true,
        }}
      />
    )

    // Render form and autocomplete results
    const autocompleteResults = listbox().get()
    expect(getAllByRole(autocompleteResults, "group")).toHaveLength(3)

    const vehiclesResults = vehiclesResultsGroup.get()
    const runResults = runResultsGroup.get()
    const operatorsResults = operatorsResultsGroup.get()

    expect(option(idVehicle.label!).get(vehiclesResults)).toBeInTheDocument()

    expect(option(runVehicle.runId!).get(runResults)).toBeInTheDocument()

    expect(
      option(formatOperatorNameFromVehicle(operatorVehicle)).get(
        operatorsResults
      )
    ).toBeInTheDocument()
  })

  test("when rendered, should not show more than `maxElementsPerGroup` results", () => {
    const searchText = "12345"
    const maxLength = 5

    ;(useAutocompleteResults as jest.Mock).mockImplementation(
      (text: string, _) =>
        ({
          [searchText]: {
            vehicle: vehicleFactory.buildList(maxLength + 2),
            operator: [],
            run: [],
          },
        }[text] || {})
    )

    render(
      <GroupedAutocompleteFromSearchTextResults
        controlName="Search Suggestions"
        maxElementsPerGroup={maxLength}
        fallbackOption={null}
        onSelectVehicleOption={() => {}}
        searchText={searchText}
        searchFilters={{
          location: false,
          operator: true,
          run: true,
          vehicle: true,
        }}
      />
    )

    // Render form and autocomplete results
    const autocompleteResults = listbox().get()
    expect(getAllByRole(autocompleteResults, "group")).toHaveLength(1)

    const vehiclesResults = vehiclesResultsGroup.get()

    expect(vehiclesResults.children).toHaveLength(maxLength)
  })

  test.todo(
    "when searchText changes, should show new results"
    // , () => {
    //   const searchText = "12345"
    //   const updatedSearchText = searchText + "123"
    //   const { rerender } = render(<SearchAutocomplete searchText={searchText} />)
    //   rerender(<SearchAutocomplete searchText={updatedSearchText} />)
    //   // Render form and autocomplete results

    //   const autocompleteContainer = autocomplete.get()
    //   expect(autocompleteContainer).toBeInTheDocument()

    //   expect(
    //     within(autocompleteContainer).getByRole("listitem", {
    //       name: "New Search Result",
    //     })
    //   ).not.toBeInTheDocument()
    //   expect(
    //     within(autocompleteContainer).getByRole("listitem", {
    //       name: "Old Search Result",
    //     })
    //   ).toBeInTheDocument()

    //   // Update search

    //   expect(
    //     within(autocompleteContainer).getByRole("listitem", {
    //       name: "New Search Result",
    //     })
    //   ).toBeInTheDocument()
    //   expect(
    //     within(autocompleteContainer).getByRole("listitem", {
    //       name: "Old Search Result",
    //     })
    //   ).not.toBeInTheDocument()
    // }
  )

  test.todo(
    "when showing results, should not show a category if there are no results"
    //   () => {
    //     const validSearchState = validSearchFactory.build()

    //     const autocompleteContainer = autocomplete.get()
    //     expect(autocompleteContainer).toBeInTheDocument()

    //     function validateGroup(groupName: string) {
    //       const group = within(autocompleteContainer).getByRole("group", {
    //         name: groupName,
    //       })
    //       expect(group).toBeInTheDocument()
    //       expect(within(group).getAllByRole("listitem")).toHaveLength(5)
    //     }

    //     expect(
    //       within(autocompleteContainer).queryByRole("group", { name: "Vehicles" })
    //     ).not.toBeInTheDocument()
    //     validateGroup("Operators")
    //     validateGroup("Runs")
    //     validateGroup("Locations")
    //   }
  )

  test.todo(
    "when supplied with search filters, should not show disabled categories"
    //   () => {
    //     const validSearchState = validSearchFactory.build()

    //     const autocompleteContainer = autocomplete.get()
    //     expect(autocompleteContainer).toBeInTheDocument()

    //     function validateGroup(groupName: string) {
    //       const group = within(autocompleteContainer).getByRole("group", {
    //         name: groupName,
    //       })
    //       expect(group).toBeInTheDocument()
    //       expect(within(group).getAllByRole("listitem")).toHaveLength(5)
    //     }

    //     expect(
    //       within(autocompleteContainer).queryByRole("group", { name: "Vehicles" })
    //     ).not.toBeInTheDocument()
    //     validateGroup("Operators")
    //     validateGroup("Runs")
    //     validateGroup("Locations")
    //   }
  )
})
