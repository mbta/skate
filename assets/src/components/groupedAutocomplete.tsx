import { captureException } from "@sentry/react"
import React, {
  ComponentPropsWithoutRef,
  MutableRefObject,
  ReactEventHandler,
  ReactNode,
  useContext,
  useEffect,
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
import { SocketContext } from "../contexts/socketContext"

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
 * The possible cursor location.
 *
 * - `undefined` when there is no location.
 * - `group` and `option` are defined to be a position contained within a
 * {@link LengthsContext}.
 */
type CursorLocation = { group: number; option: number } | undefined

/**
 * The {@link cursorLocationReducer} state type.
 *
 * Contains the last reported status
 */
type CursorState = {
  /**
   * Provides the current location of the cursor within the {@link LengthsContext}.
   */
  location: CursorLocation
  /**
   * The status result of the last reducer update.
   * This is set to `undefined` on next update that does not have a notable status.
   */
  status: CursorStatus
}

/**
 * Check if the {@link proposedLocation} is a valid location within
 * {@link lengthsContext}.
 *
 * @param proposedLocation The {@link CursorLocation} to test if it is valid
 * @param lengthsContext The {@link LengthsContext} used to bounds check {@link proposedLocation}
 * @returns `true` if the {@link proposedLocation} is within the {@link lengthsContext}, otherwise `false`
 */
const isValidLocation = (
  proposedLocation: CursorLocation,
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
 * {@link CursorLocation} based on the {@link isValidLocation} validity check.
 *
 * @param proposedLocation The {@link CursorLocation} to test and return if it is valid.
 * @param lengthsContext The {@link LengthsContext} used to bounds check {@link proposedLocation}.
 * @returns {} {@link proposedLocation} if {@link proposedLocation} is valid, otherwise `undefined`.
 */
const getValidLocationOrUnset = (
  proposedLocation: CursorLocation,
  lengthsContext: LengthsContext
): CursorLocation => {
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
      forceLocation: CursorLocation
    }
)

/**
 * A State Reducer that moves a {@link CursorLocation cursor} to leaf coordinates
 * within a 2d jagged array defined by a {@link LengthsContext}.
 */
const cursorLocationReducer = (
  state: CursorState,
  nextAction: CursorStateAction
): CursorState => {
  const { location } = state
  const { lengthsContext } = nextAction

  // Curry `lengthsContext` into `getValidLocationOrUnset`
  const getValidLocationOrUnsetWithLengthsContext = (
    proposedLocation: CursorLocation
  ) => getValidLocationOrUnset(proposedLocation, lengthsContext)

  // Early exit if we're simply setting the position
  if ("forceLocation" in nextAction) {
    return cursorState(
      getValidLocationOrUnsetWithLengthsContext(nextAction.forceLocation)
    )
  }

  const { action } = nextAction

  // Do actions that don't require knowing the type of the `cursorState`
  switch (action) {
    case CursorLocationAction.DeleteCursor: {
      return cursorState(undefined)
    }

    case CursorLocationAction.MoveToStart: {
      // In case the length of the arrays are zero
      // Check if the first value is valid
      return cursorState(
        getValidLocationOrUnsetWithLengthsContext({ group: 0, option: 0 })
      )
    }

    case CursorLocationAction.MoveToEnd: {
      // Check if the last value of each length is valid
      return cursorState(
        getValidLocationOrUnsetWithLengthsContext({
          group: lengthsContext.length - 1,
          // move out of bounds ( < 0) if it doesn't exist
          option: lengthsContext[lengthsContext.length - 1] - 1,
        })
      )
    }
  }

  // Do actions that require the `cursorState`

  // Return the current state if it's invalid
  if (!location) {
    return cursorState(location)
  }

  switch (action) {
    case CursorLocationAction.FindNearestValidLocation: {
      // Constrain current cursor to bounds of `lengthsContext`
      return cursorState(findNearestValidLocation())
    }

    case CursorLocationAction.MoveNext: {
      const validCursorLocation =
        getValidLocationOrUnsetWithLengthsContext({
          ...location,
          option: location.option + 1,
        }) ||
        // Then the first option in the next group
        getValidLocationOrUnsetWithLengthsContext({
          group: location.group + 1,
          option: 0,
        })

      if (validCursorLocation !== undefined) {
        return cursorState(validCursorLocation)
      }

      // Otherwise return the current state as we've reached the end
      return cursorState(location, CursorStatus.ExitEnd)
    }

    case CursorLocationAction.MovePrev: {
      const validCursorLocation =
        // Try the option index before the current option
        getValidLocationOrUnsetWithLengthsContext({
          ...location,
          option: location.option - 1,
        }) ||
        // Try the last option of the previous group
        getValidLocationOrUnsetWithLengthsContext({
          group: location.group - 1,
          option: lengthsContext[location.group - 1] - 1,
        })

      if (validCursorLocation) {
        return cursorState(validCursorLocation)
      }

      return cursorState(location, CursorStatus.ExitStart)
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
        state,
        action,
        lengthsContext,
      },
    }
  )
  return cursorState(location)

  /**
   * Constrain {@link location} onto the region defined by the
   * {@link lengthsContext}.
   */
  function findNearestValidLocation() {
    // Do not snap an undefined cursor.
    if (location === undefined) {
      return undefined
    }

    // Clamp existing cursor into [0, Array.length) in each dimension
    const group = clamp(location.group, 0, lengthsContext.length - 1)
    const option = clamp(location.option, 0, lengthsContext[group] - 1)
    return {
      group,
      option,
    }
  }

  /**
   * {@link CursorState} constructor that defaults the {@link status `status`}
   * to `undefined` if the {@link status `status`} parameter is not provided.
   *
   * This ensures that {@link status `status`} only describes the status of the
   * last iteration.
   */
  function cursorState(
    location: CursorLocation,
    status = CursorStatus.None
  ): CursorState {
    return { location, status }
  }
}

/**
 * {@link cursorLocationReducer} return state with helper functions.
 */
interface CursorReducerControls {
  /**
   * The current {@link CursorState}
   */
  cursorState: CursorState

  /**
   * Function to move the state {@link CursorLocation `cursorLocation`}
   * relatively within the {@link LengthsContext}
   */
  updateCursorLocation: (action: CursorLocationAction) => void

  /**
   * Set the {@link CursorLocation}, if the {@link CursorLocation} is valid
   * within the {@link LengthsContext}.
   */
  setCursorLocation: (forceLocation: CursorLocation) => void
}

/**
 * Helper hook to pre-configure functions with {@link LengthsContext} from the
 * {@link groups groups parameter} and a few specialty functions.
 *
 * @param groups The {@link AutocompleteDataGroup} array used to generate a
 * {@link LengthsContext} to check the {@link CursorState} argument and actions.
 *
 * @returns The current cursor state and functions to modify the state.
 */
const useCursorLocationFromGroups = (
  groups: AutocompleteDataGroup[],
  onCursor?: AutocompleteCursorEventProps
): CursorReducerControls => {
  const lengthsContext = groups.map(({ group }) => group.options.length)

  const [cursorLocation, dispatchCursorLocation] = useReducer(
    cursorLocationReducer,
    { location: undefined, status: CursorStatus.None }
  )

  const commonArgs = { lengthsContext, onCursor }

  return {
    /**
     * The current {@link CursorLocation `cursorLocation`}
     */
    cursorState: cursorLocation,
    /**
     * Function to move the {@link CursorLocation `cursorLocation`} relatively
     * within the {@link LengthsContext}
     */
    updateCursorLocation: (action: CursorLocationAction) =>
      dispatchCursorLocation({ action, ...commonArgs }),
    /**
     * Set the {@link CursorLocation}, if the {@link CursorLocation} is valid
     * within the {@link LengthsContext}.
     */
    setCursorLocation: (forceLocation: CursorLocation) =>
      dispatchCursorLocation({ forceLocation, ...commonArgs }),
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
  optionGroups: AutocompleteDataGroup[]
  /**
   * The name of the control. Read to screen readers when control receives focus.
   */
  controlName: ReactNode
  /**
   * React Component to use as the heading and aria-label for the results list.
   *
   * Defaults to "h2".
   */
  Heading?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  /**
   * Component to display when there are 0 search results.
   */
  fallbackOption: AutocompleteOptionData
  /**
   * Events related to cursor action callbacks.
   */
  onCursor?: AutocompleteCursorEventProps
}

/**
 * The status result of the {@link cursorLocationReducer}.
 * Describes the
 */
export enum CursorStatus {
  None = "None",
  ExitStart = "ExitStart",
  ExitEnd = "ExitEnd",
}

export type CursorExitStatus = CursorStatus.ExitEnd | CursorStatus.ExitStart

function isCursorExitStatus(status: CursorStatus): status is CursorExitStatus {
  return status === CursorStatus.ExitEnd || status === CursorStatus.ExitStart
}

/**
 * Props related to callbacks from the {@link cursorLocationReducer}.
 */
interface AutocompleteCursorEventProps {
  /**
   * Callback when the cursor attempts to leave the listbox.
   * @param CursorExitDirection The direction the cursor attempted to exit from.
   */
  onCursorExitEdge?: (direction: CursorExitStatus) => void
}

/**
 * Use {@link autocompleteOption} to construct this type.
 */
type AutocompleteOptionData = {
  option: {
    label: ReactNode
    onSelectOption?: ReactEventHandler
  }
}
/**
 * {@link AutocompleteOptionData} constructor.
 */
export const autocompleteOption = (
  label: ReactNode,
  onSelectOption?: ReactEventHandler
): AutocompleteOptionData => ({
  option: {
    label,
    onSelectOption,
  },
})

/**
 * Use {@link autocompleteGroup} to construct this type.
 */
type AutocompleteDataGroup = {
  group: {
    title: ReactNode
    options: AutocompleteOptionData[]
  }
}

/**
 *
 *
 * @param title Group Heading
 * @param options Options belonging to the group
 */
export function autocompleteGroup(
  title: ReactNode,
  ...options: AutocompleteOptionData[]
): AutocompleteDataGroup {
  return {
    group: {
      title,
      options,
    },
  }
}
/**
 * A keyboard & mouse navigable control containing a list of list of options.
 * Provides callbacks when options are selected.
 */
export const GroupedAutocomplete = ({
  id,
  controlName,
  optionGroups,
  controllerRef,
  fallbackOption,
  onCursor,
  Heading = "h2",
}: GroupedAutocompleteProps) => {
  const listHeadingId = useId()

  // Fallback option and group
  if (optionGroups.length === 0) {
    optionGroups = [
      {
        group: {
          title: null,
          options: [fallbackOption],
        },
      },
    ]
  }

  const {
    cursorState: { location: cursorLocation, status },
    updateCursorLocation,
    setCursorLocation,
  } = useCursorLocationFromGroups(optionGroups, onCursor)

  useEffect(() => {
    if (isCursorExitStatus(status)) {
      onCursor?.onCursorExitEdge?.(status)
    }
  }, [status])

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
        {optionGroups.map(({ group: { title, options } }, groupIndex) => (
          <GroupOptionList key={groupIndex} heading={title}>
            {options.map(
              ({ option: { label, onSelectOption } }, optionIndex) => {
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
                    onClick={onSelectOption}
                    onKeyDown={(e) => {
                      // Fire `onSelectOption` if enter is pressed
                      if (e.key != "Enter") {
                        return
                      }
                      e.preventDefault()
                      e.stopPropagation()
                      onSelectOption?.(e)
                    }}
                    // If this element is selected by the cursor,
                    // set document focus to this element when mounted.
                    ref={(selected || null) && ((r) => r?.focus())}
                    // Allow element to be focused as a control.
                    tabIndex={-1}
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
    Omit<GroupedAutocompleteProps, "optionGroups"> {
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
   * @param selectedOption The selected option vehicle
   *
   * ---
   * @todo
   *   Potentially rewrite this to be generic across option values.
   *
   *   Alternatively provide more callbacks for specific types to avoid
   *   type deduction.
   */
  onSelectVehicleOption: (selectedOption: Vehicle | Ghost) => void
}

/**
 * A {@link GroupedAutocomplete} which retrieves it's options from the
 * {@link searchText} provided and {@link useAutocompleteResults}.
 */
export const GroupedAutocompleteFromSearchTextResults = ({
  onSelectVehicleOption: onSelectVehicleOptionProp,
  searchText,
  searchFilters,
  maxElementsPerGroup = 5,
  ...props
}: GroupedAutocompleteFromSearchTextResultsProps) => {
  const { socket } = useContext(SocketContext)
  const {
    vehicle: vehicles,
    run: runs,
    operator: operators,
  } = useAutocompleteResults(
    socket,
    searchText,
    searchFilters,
    maxElementsPerGroup
  )

  const onSelectVehicleOption = (selectedOption: Vehicle | Ghost) => () => {
    onSelectVehicleOptionProp(selectedOption)
  }

  // Build groups and options from search results.
  const groups = [
    autocompleteGroup(
      <h2>{searchPropertyDisplayConfig.vehicle.name}</h2>,
      ...vehicles
        .slice(0, maxElementsPerGroup)
        .map((v) =>
          autocompleteOption(
            (isVehicle(v) && v.label) || v.id,
            onSelectVehicleOption(v)
          )
        )
    ),
    autocompleteGroup(
      <h2>{searchPropertyDisplayConfig.operator.name}</h2>,
      ...operators
        .filter(isVehicle)
        .slice(0, maxElementsPerGroup)
        .map((v) =>
          autocompleteOption(
            formatOperatorNameFromVehicle(v),
            onSelectVehicleOption(v)
          )
        )
    ),
    autocompleteGroup(
      <h2>{searchPropertyDisplayConfig.run.name}</h2>,
      ...runs
        .slice(0, maxElementsPerGroup)
        .map((v) => autocompleteOption(v.runId, onSelectVehicleOption(v)))
    ),
  ].filter(({ group: { options } }) => options.length > 0)

  return <GroupedAutocomplete {...props} optionGroups={groups} />
}
// #endregion Autocomplete From Search Context
