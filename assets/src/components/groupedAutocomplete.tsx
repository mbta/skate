import { captureException } from "@sentry/react"
import React, {
  ComponentPropsWithoutRef,
  MutableRefObject,
  ReactEventHandler,
  ReactNode,
  useId,
  useImperativeHandle,
  useReducer,
} from "react"

import { useAutocompleteResults } from "../hooks/useAutocompleteResults"
import {
  SearchProperties,
  searchPropertyDisplayConfig,
} from "../models/searchQuery"
import { isVehicle } from "../models/vehicle"
import { Ghost, Vehicle } from "../realtime"
import { clamp } from "../util/math"
import { formatOperatorNameFromVehicle } from "../util/operatorFormatting"

// #region Autocomplete Control
// #region Cursor Reducer

/**
 * Represents the 2D jagged array of groups and options per group.
 *
 * The length of the array is the number of groups.
 * The element of the array is the number of options within that group.
 */
type LengthsContext = number[]

/**
 * The possible cursor states.
 *
 * - `undefined` when there is no cursor state.
 * - Group and Option are defined to be a position contained within a
 * {@link LengthsContext}.
 */
type CursorState = { group: number; option: number } | undefined

/**
 * Check if the {@link proposedLocation} is a valid location within
 * {@link lengthsContext}.
 *
 * @param proposedLocation The {@link CursorState} to test if it is valid
 * @param lengthsContext The {@link LengthsContext} used to bounds check {@link proposedLocation}
 * @returns `true` if the {@link proposedLocation} is within the {@link lengthsContext}, otherwise `false`
 */
const isValidLocation = (
  proposedLocation: CursorState,
  lengthsContext: LengthsContext
): boolean => {
  if (!proposedLocation) {
    return false
  }

  const { group: x, option: y } = proposedLocation
  return Boolean(
    0 <= x && 0 <= y && x < lengthsContext.length && y < lengthsContext[x]
  )
}

/**
 * Checks if the {@link proposedLocation} is valid and returns a
 * {@link CursorState} based on the {@link isValidLocation} validity check.
 *
 * @param proposedLocation The {@link CursorState} to test and return if it is valid.
 * @param lengthsContext The {@link LengthsContext} used to bounds check {@link proposedLocation}.
 * @returns {} {@link proposedLocation} if {@link proposedLocation} is valid, otherwise `undefined`.
 */
const getValidLocationOrUnset = (
  proposedLocation: CursorState,
  lengthsContext: LengthsContext
): CursorState => {
  return isValidLocation(proposedLocation, lengthsContext)
    ? proposedLocation
    : undefined
}

/**
 * Valid {@link cursorLocationReducer} commands.
 */
enum CursorLocationAction {
  MoveToStart = "MoveToStart",
  MoveToEnd = "MoveToEnd",
  ForceCursorTo = "ForceCursorTo",
  DeleteCursor = "DeleteCursor",
  MoveNext = "MoveNext",
  MovePrev = "MovePrev",
  FindNearestValidLocation = "FindNearestValidLocation",
}

/**
 * {@link cursorLocationReducer} commands and arguments.
 */
type CursorStateAction = {
  lengthsContext: LengthsContext
} & (
  | {
      action: CursorLocationAction
    }
  | {
      forceLocation: CursorState
    }
)

/**
 * A State Reducer that moves a {@link CursorState cursor} to leaf coordinates
 * within a 2d jagged array defined by a {@link LengthsContext}.
 */
const cursorLocationReducer = (
  cursorState: CursorState,
  nextAction: CursorStateAction
): CursorState => {
  const { lengthsContext } = nextAction

  // Curry `lengthsContext` into `getValidLocationOrUnset`
  const getValidLocationOrUnsetWithLengthsContext = (
    proposedLocation: CursorState
  ) => getValidLocationOrUnset(proposedLocation, lengthsContext)

  // Early exit if we're simply setting the position
  if ("forceLocation" in nextAction) {
    return getValidLocationOrUnsetWithLengthsContext(nextAction.forceLocation)
  }

  const { action } = nextAction

  // Do actions that don't require knowing the type of the `cursorState`
  switch (action) {
    case CursorLocationAction.DeleteCursor: {
      return undefined
    }

    case CursorLocationAction.MoveToStart: {
      // In case the length of the arrays are zero
      // Check if the first value is valid
      return getValidLocationOrUnsetWithLengthsContext({ group: 0, option: 0 })
    }

    case CursorLocationAction.MoveToEnd: {
      // Check if the last value of each length is valid
      return getValidLocationOrUnsetWithLengthsContext({
        group: lengthsContext.length - 1,
        // move out of bounds ( < 0) if it doesn't exist
        option: lengthsContext[lengthsContext.length - 1] - 1,
      })
    }
  }

  // Do actions that require the `cursorState`

  // Return the current state if it's invalid
  if (!cursorState) {
    return cursorState
  }

  switch (action) {
    case CursorLocationAction.FindNearestValidLocation: {
      // Constrain current cursor to bounds of `lengthsContext`
      const group = clamp(cursorState.group, 0, lengthsContext.length - 1)
      return getValidLocationOrUnsetWithLengthsContext({
        group,
        option: clamp(cursorState.option, 0, lengthsContext[group] - 1),
      })
    }

    case CursorLocationAction.MoveNext: {
      return (
        // Try the option index after the current option
        getValidLocationOrUnsetWithLengthsContext({
          ...cursorState,
          option: cursorState.option + 1,
        }) ||
        // Then the first option in the next group
        getValidLocationOrUnsetWithLengthsContext({
          group: cursorState.group + 1,
          option: 0,
        }) ||
        // If the cursor state no longer matches up with the `lengthsContext`
        // Move cursor to nearest valid location
        cursorLocationReducer(cursorState, {
          lengthsContext,
          action: CursorLocationAction.FindNearestValidLocation,
        }) ||
        // Otherwise return the current state as we've reached the end
        cursorState
      )
    }

    case CursorLocationAction.MovePrev: {
      return (
        // Try the option index before the current option
        getValidLocationOrUnsetWithLengthsContext({
          ...cursorState,
          option: cursorState.option - 1,
        }) ||
        // Try the last option of the previous group
        getValidLocationOrUnsetWithLengthsContext({
          group: cursorState.group - 1,
          option: lengthsContext[cursorState.group - 1] - 1,
        }) ||
        // If the cursor state no longer matches up with the `lengthsContext`
        // Move cursor to nearest valid location
        cursorLocationReducer(cursorState, {
          lengthsContext,
          action: CursorLocationAction.FindNearestValidLocation,
        }) ||
        // Otherwise return the current cursor, as we've reached the beginning
        cursorState
      )
    }
  }

  // We really shouldn't reach this point, so for safety we'll return the
  // current state
  captureException(
    new Error(
      "internal error: entered unreachable code: end of `cursorLocationReducer`"
    ),
    {
      extra: {
        cursorState,
        lengthsContext,
        action,
      },
    }
  )
  return cursorState
}

/**
 * {@link cursorLocationReducer} return state with helper functions.
 */
interface CursorReducerControls {
  /**
   * The current {@link CursorState `cursorLocation`}
   */
  cursorLocation: CursorState

  /**
   * Function to move the {@link CursorState `cursorLocation`} relatively
   * within the {@link LengthsContext}
   */
  updateCursorLocation: (action: CursorLocationAction) => void

  /**
   * Set the {@link CursorState}, if the {@link CursorState} is valid
   * within the {@link LengthsContext}.
   */
  setCursorLocation: (forceLocation: CursorState) => void
}

/**
 * Helper hook to pre-configure functions with {@link LengthsContext} from the
 * {@link groups groups parameter} and a few specialty functions.
 *
 * @param groups The {@link AutocompleteDataGroup} array used to bounds check
 * {@link CursorState} arguments and changes.
 *
 * @returns The current cursor state and functions to modify the state.
 */
const useCursorLocationFromGroups = (
  groups: AutocompleteDataGroup[]
): CursorReducerControls => {
  const lengthsContext = groups.map(({ group }) => group.options.length)

  const [cursorLocation, dispatchCursorLocation] = useReducer(
    cursorLocationReducer,
    undefined
  )

  return {
    /**
     * The current {@link CursorLocation `cursorLocation`}
     */
    cursorLocation,
    /**
     * Function to move the {@link CursorLocation `cursorLocation`} relatively
     * within the {@link LengthsContext}
     */
    updateCursorLocation: (action: CursorLocationAction) =>
      dispatchCursorLocation({ action, lengthsContext }),
    /**
     * Set the {@link CursorLocation}, if the {@link CursorLocation} is valid
     * within the {@link LengthsContext}.
     */
    setCursorLocation: (forceLocation: CursorState) =>
      dispatchCursorLocation({ forceLocation, lengthsContext }),
  }
}
// #endregion Cursor Reducer

// #region Autocomplete Control Impl
/**
 * Props which expose references for controlling the {@link GroupedAutocomplete}
 */
export type GroupedAutocompleteControlRefProps = {
  /**
   * Reference object containing functions for controlling the
   * {@link GroupedAutocomplete}.
   */
  controllerRef?: MutableRefObject<GroupedAutocompleteControls | null>
}

/**
 * Functions to control the cursor state of the {@link GroupedAutocomplete}
 */
export interface GroupedAutocompleteControls {
  /**
   * Moves focus to first available option if it exists.
   */
  focusCursorToFirstOption: () => void
  /**
   * Deletes the cursor in the control, relinquish's focus control.
   */
  forgetCursor: () => void
}

/**
 * General configuration props for the {@link GroupedAutocomplete} control.
 */
export interface GroupedAutocompleteProps
  extends GroupedAutocompleteControlRefProps {
  /**
   * The ID of the `listbox` control.
   *
   * Mainly used for aria compatibility.
   */
  id?: string
  /**
   * The groups and options to render as clickable elements in the control.
   */
  groups: AutocompleteDataGroup[]
  /**
   * The name of the control. Read to screen readers when control receives focus.
   */
  controlName: ReactNode
  /**
   * React Component to use as the heading and aria-label for the results list.
   *
   * This component must expose the following props
   * - `aria-hidden`
   * - `className`
   * - `id`
   *
   * Defaults to "h2".
   */
  Heading?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  /**
   * Component to display when there are 0 search results.
   */
  fallbackOption: ReactNode
  /**
   * Callback when the {@link fallbackOption} is chosen in the autocomplete.
   */
  onFallbackOptionChosen?: React.ReactEventHandler
}

type AutocompleteOptionData = {
  option: {
    label: ReactNode
    onOptionChosen: ReactEventHandler
  }
}

export type AutocompleteDataGroup = {
  group: {
    title: ReactNode
    options: AutocompleteOptionData[]
  }
}

/**
 * A keyboard & mouse navigable control containing a list of list of options.
 * Provides callbacks when options are selected.
 */
export const GroupedAutocomplete = ({
  id,
  controlName,
  groups,
  controllerRef,
  fallbackOption,
  onFallbackOptionChosen,
  Heading = "h2",
}: GroupedAutocompleteProps) => {
  const listHeadingId = useId()

  // Fallback option and group
  if (groups.length === 0) {
    groups = [
      {
        group: {
          title: null,
          options: [
            {
              option: {
                label: fallbackOption,
                onOptionChosen: (e) => onFallbackOptionChosen?.(e),
              },
            },
          ],
        },
      },
    ]
  }

  const { cursorLocation, updateCursorLocation, setCursorLocation } =
    useCursorLocationFromGroups(groups)

  useImperativeHandle(
    controllerRef,
    (): GroupedAutocompleteControls => ({
      focusCursorToFirstOption() {
        updateCursorLocation(CursorLocationAction.MoveToStart)
      },
      forgetCursor() {
        updateCursorLocation(CursorLocationAction.DeleteCursor)
      },
    })
  )

  return (
    <div className="c-autocomplete">
      <Heading
        className="visually-hidden"
        role="presentation"
        aria-hidden={true}
        id={listHeadingId}
      >
        {controlName}
      </Heading>

      <div
        id={id}
        role="listbox"
        className="c-autocomplete__list"
        onFocus={(event) => {
          // Check if the previously focused element is a child of this element.
          const autocompleteControlAlreadyHadFocus =
            event.currentTarget.contains(event.relatedTarget)
          // set the cursor to the first element if:
          // - the user focused an element in the autocomplete control that is not an option
          //   (option focus event prevents propagation).
          // - the cursor is unset or the autocomplete control does not contain the previously focused element.
          if (
            cursorLocation === undefined ||
            autocompleteControlAlreadyHadFocus === false
          ) {
            updateCursorLocation(CursorLocationAction.MoveToStart)
          }
        }}
        onBlur={(event) => {
          // Delete the cursor state if the user's focus exits the autocomplete
          // control.
          if (event.currentTarget.contains(event.relatedTarget)) {
            return
          }

          updateCursorLocation(CursorLocationAction.DeleteCursor)
        }}
        onKeyDown={(e) => {
          // Handle cursor movement by keyboard.
          // If the key is not a movement key, allow event to bubble up.
          switch (e.key) {
            case "ArrowDown":
              updateCursorLocation(CursorLocationAction.MoveNext)
              break
            case "ArrowUp":
              updateCursorLocation(CursorLocationAction.MovePrev)
              break
            case "Home":
              updateCursorLocation(CursorLocationAction.MoveToStart)
              break
            case "End":
              updateCursorLocation(CursorLocationAction.MoveToEnd)
              break
            default:
              return
          }
          e.preventDefault()
          e.stopPropagation()
        }}
        aria-labelledby={listHeadingId}
        tabIndex={-1}
      >
        {groups.map(({ group: { title, options } }, groupIndex) => (
          <GroupOptionList key={groupIndex} heading={title}>
            {options.map(
              ({ option: { label, onOptionChosen } }, optionIndex) => {
                const selected =
                  cursorLocation &&
                  cursorLocation.group === groupIndex &&
                  cursorLocation.option === optionIndex
                return (
                  <li
                    key={optionIndex}
                    className="c-autocomplete__option"
                    role="option"
                    aria-selected={selected}
                    onFocus={(e) => {
                      // Set cursor to this location if focused.
                      !selected &&
                        setCursorLocation({
                          group: groupIndex,
                          option: optionIndex,
                        })
                      e.stopPropagation()
                    }}
                    onClick={onOptionChosen}
                    onKeyDown={(e) => {
                      // Fire `optionChosen` if enter is pressed
                      if (!["Enter"].includes(e.key)) {
                        return
                      }
                      e.preventDefault()
                      e.stopPropagation()
                      onOptionChosen?.(e)
                    }}
                    // If this element is selected by the cursor,
                    // set document focus to this element when mounted.
                    ref={(selected || null) && ((r) => r?.focus())}
                    // Allow user to tab into the first option and out of
                    // the autocomplete control on next `Tab` key.
                    tabIndex={groupIndex === 0 && optionIndex === 0 ? 0 : -1}
                  >
                    {label}
                  </li>
                )
              }
            )}
          </GroupOptionList>
        ))}
      </div>
    </div>
  )
}

// #region LabelledList Components
type LabelledListProps = {
  heading: ReactNode
  headingProps?: ComponentPropsWithoutRef<"div">
} & ComponentPropsWithoutRef<"ul">

/**
 * Component which binds a list aria-label to the supplied {@link heading} as a
 * sibling so that screen readers to not count the heading as a option or group.
 */
const LabelledListboxGroup = ({
  heading,
  headingProps,
  ...props
}: LabelledListProps) => {
  const id = useId()

  return (
    <>
      <div
        role="presentation"
        {...headingProps}
        aria-hidden={true}
        id={id}
        style={{ userSelect: "none" }}
      >
        {heading}
      </div>
      <ul role="group" {...props} aria-labelledby={id} />
    </>
  )
}

/**
 * {@link GroupedAutocomplete} {@link LabelledListboxGroup} component.
 */
const GroupOptionList = (props: LabelledListProps) => (
  <LabelledListboxGroup
    {...props}
    headingProps={{ className: "c-autocomplete__group-heading" }}
    className="c-autocomplete__group-list"
  />
)
// #endregion LabelledList Components
// #endregion Autocomplete Control Impl
// #endregion Autocomplete Control

// #region Autocomplete From Search Context
/**
 * {@link GroupedAutocompleteFromSearchTextResults} Props
 */
interface GroupedAutocompleteFromSearchTextResultsProps
  extends GroupedAutocompleteControlRefProps,
    Omit<GroupedAutocompleteProps, "groups"> {
  /**
   * Text to search to populate the autocomplete options with.
   */
  searchText: string
  /**
   * Filters to apply when searching for {@link searchText}.
   */
  searchFilters: SearchProperties<boolean>
  /**
   * Max number of options to render in a group.
   */
  maxElementsPerGroup?: number
  /**
   * Callback when a autocomplete vehicle option is selected.
   * @param chosenOption The selected option vehicle
   *
   * ---
   * @todo
   *   Potentially rewrite this to be generic across option values.
   *
   *   Alternatively provide more callbacks for specific types to avoid
   *   type deduction.
   */
  onVehicleOptionChosen: (chosenOption: Vehicle | Ghost) => void
}

/**
 * A {@link GroupedAutocomplete} which retrieves it's options from the
 * {@link searchText} provided and {@link useAutocompleteResults}.
 */
export const GroupedAutocompleteFromSearchTextResults = ({
  onVehicleOptionChosen: onVehicleOptionChosenProp,
  searchText,
  searchFilters,
  maxElementsPerGroup = 5,
  ...props
}: GroupedAutocompleteFromSearchTextResultsProps) => {
  const {
    vehicle: vehicles,
    run: runs,
    operator: operators,
  } = useAutocompleteResults(searchText, searchFilters, maxElementsPerGroup)

  const onVehicleOptionChosen = (chosenOption: Vehicle | Ghost) => () => {
    onVehicleOptionChosenProp(chosenOption)
  }

  // Build groups and options from search results.
  const groups = [
    {
      group: {
        title: <h2>{searchPropertyDisplayConfig.vehicle.name}</h2>,
        options: vehicles.slice(0, maxElementsPerGroup).map((v) => ({
          option: {
            onOptionChosen: onVehicleOptionChosen(v),
            label: (isVehicle(v) && v.label) || v.id,
          },
        })),
      },
    },
    {
      group: {
        title: <h2>{searchPropertyDisplayConfig.operator.name}</h2>,
        options: operators
          .slice(0, maxElementsPerGroup)
          .filter(isVehicle)
          .map((v) => ({
            option: {
              onOptionChosen: onVehicleOptionChosen(v),
              label: formatOperatorNameFromVehicle(v),
            },
          })),
      },
    },
    {
      group: {
        title: <h2>{searchPropertyDisplayConfig.run.name}</h2>,
        options: runs.slice(0, maxElementsPerGroup).map((v) => ({
          option: {
            onOptionChosen: onVehicleOptionChosen(v),
            label: v.runId,
          },
        })),
      },
    },
  ].filter(({ group: { options } }) => options.length > 0)

  return <GroupedAutocomplete {...props} groups={groups} />
}
// #endregion Autocomplete From Search Context
