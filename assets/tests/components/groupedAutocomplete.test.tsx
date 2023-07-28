import "@testing-library/jest-dom"
import { getAllByRole, render, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React, { MutableRefObject } from "react"
import { act } from "react-dom/test-utils"
import { byRole } from "testing-library-selector"

import {
  GroupedAutocomplete,
  GroupedAutocompleteControls,
} from "../../src/components/groupedAutocomplete"
import vehicleFactory from "../factories/vehicle"

const autocompleteList = (name = "Search Suggestions") =>
  byRole("listbox", { name })

const makeAutocompleteGroup = (name: string) => byRole("group", { name })

const autocompleteOption = (name: string) => byRole("option", { name })

describe("<SearchAutocomplete/>", () => {
  test("when rendered, should show results", () => {
    const onOptionChosen = jest.fn()

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
                    onOptionChosen,
                  },
                },
                {
                  option: {
                    label: <div>Option 2</div>,
                    onOptionChosen,
                  },
                },
                {
                  option: {
                    label: <em>Option 3</em>,
                    onOptionChosen,
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
                    onOptionChosen,
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
                    onOptionChosen,
                  },
                },
                {
                  option: {
                    label: "Option 6",
                    onOptionChosen,
                  },
                },
                {
                  option: {
                    label: "Option 7",
                    onOptionChosen,
                  },
                },
                {
                  option: {
                    label: "Option 8",
                    onOptionChosen,
                  },
                },
                {
                  option: {
                    label: <label>{option9Label}</label>,
                    onOptionChosen,
                  },
                },
              ],
            },
          },
        ]}
      />
    )

    // Render form and autocomplete results

    const autocompleteResults = autocompleteList("Autocomplete List").get()
    expect(getAllByRole(autocompleteResults, "group")).toHaveLength(3)

    const group1Results = makeAutocompleteGroup(group1Title).get()
    const group2Results = makeAutocompleteGroup(group2Title).get()
    const group3Results = makeAutocompleteGroup(group3Title).get()

    expect(
      autocompleteOption(option1Label).get(group1Results)
    ).toBeInTheDocument()

    expect(
      autocompleteOption(option4Label).get(group2Results)
    ).toBeInTheDocument()

    expect(
      autocompleteOption(option9Label).get(group3Results)
    ).toBeInTheDocument()
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

    expect(
      autocompleteOption(fallbackLabel).get(autocompleteList().get())
    ).toBeInTheDocument()
  })

  test("when autocomplete is focused, should move cursor and focus to first result", async () => {
    const onOptionChosen = jest.fn()

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
                    onOptionChosen,
                  },
                },
              ],
            },
          },
        ]}
      />
    )

    const autocomplete = autocompleteList().get()

    act(() => {
      autocomplete.focus()
    })

    await waitFor(() =>
      expect(autocompleteOption(option1Label).get(autocomplete)).toHaveFocus()
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

    const autocomplete = autocompleteList().get()

    act(() => {
      autocomplete.focus()
    })

    await waitFor(() =>
      expect(
        autocompleteOption(fallbackOptionLabel).get(autocomplete)
      ).toHaveFocus()
    )
  })

  describe("when down arrow is pressed, should select next result", () => {
    test("in same group", async () => {
      const onOptionChosen = jest.fn()
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
                      onOptionChosen,
                    },
                  },
                  {
                    option: {
                      label: option2Label,
                      onOptionChosen,
                    },
                  },
                ],
              },
            },
          ]}
        />
      )

      const option1 = autocompleteOption(option1Label).get()
      const option2 = autocompleteOption(option2Label).get()

      act(() => option1.focus())

      await userEvent.keyboard("{ArrowDown}")

      expect(option2).toHaveFocus()
    })

    test("in next group", async () => {
      const onOptionChosen = jest.fn()
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
                      onOptionChosen,
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
                      onOptionChosen,
                    },
                  },
                ],
              },
            },
          ]}
        />
      )

      const group1 = makeAutocompleteGroup(group1Title).get()
      const group2 = makeAutocompleteGroup(group2Title).get()

      const option1 = autocompleteOption(option1Label).get(group1)
      const option2 = autocompleteOption(option2Label).get(group2)

      act(() => {
        option1.focus()
      })

      await userEvent.keyboard("{ArrowDown}")

      await waitFor(() => expect(option2).toHaveFocus())
    })
  })

  describe("when up arrow is pressed, should select previous result", () => {
    test("in same group", async () => {
      const onOptionChosen = jest.fn()
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
                      onOptionChosen,
                    },
                  },
                  {
                    option: {
                      label: option2Label,
                      onOptionChosen,
                    },
                  },
                ],
              },
            },
          ]}
        />
      )

      const option1 = autocompleteOption(option1Label).get()
      const option2 = autocompleteOption(option2Label).get()

      act(() => option2.focus())

      await userEvent.keyboard("{ArrowUp}")

      expect(option1).toHaveFocus()
    })

    test("in next group", async () => {
      const onOptionChosen = jest.fn()
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
                      onOptionChosen,
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
                      onOptionChosen,
                    },
                  },
                ],
              },
            },
          ]}
        />
      )

      const group1 = makeAutocompleteGroup(group1Title).get()
      const group2 = makeAutocompleteGroup(group2Title).get()

      const option1 = autocompleteOption(option1Label).get(group1)
      const option2 = autocompleteOption(option2Label).get(group2)

      act(() => {
        option2.focus()
      })
      await userEvent.keyboard("{ArrowUp}")

      await waitFor(() => expect(option1).toHaveFocus())
    })
  })

  test("when home is pressed, should select first result", async () => {
    const onOptionChosen = jest.fn()
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
                    onOptionChosen,
                  },
                },
                {
                  option: {
                    label: "Unrelated Option",
                    onOptionChosen,
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
                    onOptionChosen,
                  },
                },
              ],
            },
          },
        ]}
      />
    )

    const group1 = makeAutocompleteGroup(group1Title).get()
    const group2 = makeAutocompleteGroup(group2Title).get()

    const option1 = autocompleteOption(option1Label).get(group1)
    const option2 = autocompleteOption(option2Label).get(group2)

    act(() => {
      option2.focus()
    })
    await userEvent.keyboard("{Home}")

    await waitFor(() => expect(option1).toHaveFocus())
  })

  test("when end is pressed, should select last result", async () => {
    const onOptionChosen = jest.fn()
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
                    onOptionChosen,
                  },
                },
                {
                  option: {
                    label: "Unrelated Option",
                    onOptionChosen,
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
                    onOptionChosen,
                  },
                },
              ],
            },
          },
        ]}
      />
    )

    const group1 = makeAutocompleteGroup(group1Title).get()
    const group2 = makeAutocompleteGroup(group2Title).get()

    const firstOption = autocompleteOption(firstOptionLabel).get(group1)
    const lastOption = autocompleteOption(lastOptionLabel).get(group2)

    act(() => {
      firstOption.focus()
    })
    await userEvent.keyboard("{End}")

    await waitFor(() => expect(lastOption).toHaveFocus())
  })

  describe("should fire event `onOptionChosen`", () => {
    test("when enter is pressed", async () => {
      const onOptionChosen = jest.fn()
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
                      onOptionChosen,
                    },
                  },
                ],
              },
            },
          ]}
        />
      )

      const btn = autocompleteOption(optionLabel).get(autocompleteList().get())

      await userEvent.type(btn, "{Enter}")

      await waitFor(() => {
        expect(onOptionChosen).toHaveBeenCalled()
      })
    })

    test("when item is clicked", async () => {
      const onOptionChosen = jest.fn()
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
                      onOptionChosen,
                    },
                  },
                ],
              },
            },
          ]}
        />
      )

      const btn = autocompleteOption(idVehicle.label!).get(
        autocompleteList().get()
      )

      await userEvent.click(btn)

      expect(onOptionChosen).toHaveBeenCalled()
    })
  })

  test("when fallback option is clicked, should fire `onFallbackOptionChosen`", async () => {
    const onFallbackOptionChosen = jest.fn()
    const fallbackLabel = "Fallback Option"

    render(
      <GroupedAutocomplete
        controlName="Search Suggestions"
        fallbackOption={fallbackLabel}
        onFallbackOptionChosen={onFallbackOptionChosen}
        groups={[]}
      />
    )

    await userEvent.click(autocompleteOption(fallbackLabel).get())

    expect(onFallbackOptionChosen).toHaveBeenCalledTimes(1)
  })

  test("when controller function `focusCursorToFirstOption` is called, should move cursor and focus to first option", () => {
    const onOptionChosen = jest.fn()
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
                    onOptionChosen,
                  },
                },
                {
                  option: {
                    label: "Option 2",
                    onOptionChosen,
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

    expect(autocompleteOption(option1Label).get()).toHaveFocus()
  })
})
