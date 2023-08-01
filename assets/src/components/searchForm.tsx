import React, {
  SyntheticEvent,
  useContext,
  useId,
  useRef,
  useState,
} from "react"

import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { SearchIcon } from "../helpers/icon"
import {
  SearchProperties,
  SearchProperty,
  isValidSearchText,
  searchPropertyDisplayConfig,
} from "../models/searchQuery"
import { Ghost, Vehicle } from "../realtime"
import {
  SelectedEntityType,
  setSearchProperties,
  setSearchText,
  setSelectedEntity,
  submitSearch,
} from "../state/searchPageState"

import { CircleXIcon } from "./circleXIcon"
import { FilterAccordion } from "./filterAccordion"
import {
  GroupedAutocompleteControls,
  GroupedAutocompleteFromSearchTextResults,
  autocompleteOptionData,
} from "./groupedAutocomplete"

// #region Search Filters

/**
 * Object describing the current toggle state of the possible
 * {@link SearchProperty}.
 */
export type SearchFiltersState = SearchProperties<boolean>

// #endregion search filters

/**
 * Non-Essential configuration props related to {@link SearchForm}.
 */
type SearchFormConfigProps = {
  /**
   * Whether to show the autocomplete box or not
   */
  showAutocomplete?: boolean
}

/**
 * Event props related to {@link SearchForm}.
 */
type SearchFormEventProps = {
  /**
   * Callback to run when the form is submitted.
   */
  onSubmit?: React.ReactEventHandler
  /**
   * Callback to run when the form input is cleared via the clear button.
   */
  onClear?: React.ReactEventHandler
}

type SearchFormProps = SearchFormEventProps &
  SearchFormConfigProps & {
    /**
     * Text to show in the search input box.
     */
    inputText: string
    /**
     * Callback to run when {@link inputText} should be updated.
     */
    onInputTextChange?: React.ChangeEventHandler<HTMLInputElement>

    /**
     * The state of the search filters.
     */
    filters: SearchFiltersState
    /**
     * Callback to run when {@link filters} should be updated.
     */
    onFiltersChanged: (searchFilterState: SearchFiltersState) => void
    /**
     * Callback to run when a autocomplete vehicle option is selected.
     */
    onSelectVehicleOption: (selectedOption: Vehicle | Ghost) => void
  }

const allFiltersOn: SearchFiltersState = {
  vehicle: true,
  operator: true,
  run: true,
  location: true,
}
const allFiltersOff: SearchFiltersState = {
  vehicle: false,
  operator: false,
  run: false,
  location: false,
}

const Filters = ({
  filters,
  onFiltersChanged,
}: {
  filters: SearchFiltersState
  onFiltersChanged: (searchFilterState: SearchFiltersState) => void
}) => {
  const countActiveFilters = Object.values(filters).filter(
    (isActive) => isActive
  ).length
  const [hasAManuallyActivatedFilter, setHasAManuallyActivatedFilter] =
    useState(
      countActiveFilters > 0 && countActiveFilters < Object.keys(filters).length
    )

  const allFiltersActive = Object.values(filters).every((isActive) => isActive)
  const displayAsInactive = allFiltersActive && !hasAManuallyActivatedFilter
  return (
    <FilterAccordion.WithExpansionState heading="Filter results">
      {Object.entries(filters)
        .map(([property, isActive]) => ({
          property: property as SearchProperty,
          isActive,
        }))
        .sort(
          ({ property: first_property }, { property: second_property }) =>
            searchPropertyDisplayConfig[first_property].order -
            searchPropertyDisplayConfig[second_property].order
        )
        .map(({ property, isActive }) => {
          return (
            <FilterAccordion.ToggleFilter
              key={property}
              name={searchPropertyDisplayConfig[property].name}
              active={isActive && !displayAsInactive}
              onClick={() => {
                if (displayAsInactive) {
                  // Filter to only this property
                  setHasAManuallyActivatedFilter(true)
                  onFiltersChanged({ ...allFiltersOff, [property]: true })
                } else if (
                  isActive &&
                  Object.values(filters).filter((isActive) => isActive)
                    .length === 1
                ) {
                  // This filter is the last one on. Toggling it off turns all filters on
                  setHasAManuallyActivatedFilter(false)
                  onFiltersChanged(allFiltersOn)
                } else {
                  onFiltersChanged({
                    ...filters,
                    [property]: !isActive,
                  })
                }
              }}
            />
          )
        })}
    </FilterAccordion.WithExpansionState>
  )
}

/**
 * Search form which exposes all configurable state and callbacks via {@link SearchFormProps props}.
 */
export const SearchForm = ({
  inputText,
  onInputTextChange,

  filters,
  onFiltersChanged,

  onClear: onClearProp,
  onSubmit: onSubmitProp,
  onSelectVehicleOption,

  showAutocomplete: showAutocompleteProp = true,
}: SearchFormProps) => {
  const formSearchInput = useRef<HTMLInputElement | null>(null)
  const [autocompleteEnabled, setAutocompleteEnabled] = useState(true)

  const onSubmit = (e: SyntheticEvent) => {
    // Hide autocomplete on submit, should show when next character is entered
    // or next time the input is focused.
    setAutocompleteEnabled(false)
    onSubmitProp?.(e)
  }

  const onClear = (e: SyntheticEvent) => {
    // Set focus on input after input is cleared
    formSearchInput.current?.focus()
    onClearProp?.(e)
  }

  const autocompleteController = useRef<null | GroupedAutocompleteControls>(
    null
  )

  const autocompleteVisible =
    autocompleteEnabled && showAutocompleteProp && inputText.length >= 3
  const autocompleteId = useId()

  return (
    <form onSubmit={onSubmit} className="c-search-form" autoComplete="off">
      <div
        className="c-search-form__search-control"
        data-autocomplete-visible={autocompleteVisible}
        role="presentation"
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            autocompleteController.current?.focusCursorToFirstOption()

            event.preventDefault()
            event.stopPropagation()
          }
          const ignoredKeysList = [
            "ArrowDown",
            "ArrowUp",
            "Control",
            "Shift",
            "Tab",
            "Enter",
          ]
          if (
            !ignoredKeysList.includes(event.key) &&
            document.activeElement !== formSearchInput.current
          ) {
            formSearchInput.current?.focus()
          }
        }}
      >
        <div className="c-search-form__search-input-container">
          <input
            className="c-search-form__input"
            placeholder="Search"
            type="text"
            role="combobox"
            aria-haspopup="listbox"
            aria-controls={autocompleteId}
            aria-owns={autocompleteId}
            aria-expanded={autocompleteVisible}
            value={inputText}
            onChange={(e) => {
              // Show autocomplete again on next change
              setAutocompleteEnabled(true)
              onInputTextChange?.(e)
            }}
            ref={formSearchInput}
            onFocus={() => setAutocompleteEnabled(true)}
          />
        </div>
        <div
          className="c-search-form__input-controls"
          role="presentation"
          onKeyDown={(e) => {
            // Allow buttons to be pressed by space bar by preventing the parent
            // keydown handler
            if (e.key === " ") {
              e.stopPropagation()
            }
          }}
        >
          <button
            hidden={inputText.length === 0}
            className="c-search-form__clear c-circle-x-icon-container"
            type="button"
            title="Clear Search"
            onClick={(e) => {
              e.stopPropagation()
              onClear?.(e)
            }}
          >
            <CircleXIcon />
          </button>
          <button
            type="submit"
            title="Submit"
            className="c-search-form__submit"
            onClick={onSubmit}
            // TODO(design): add error states instead of using `disabled`
            disabled={!isValidSearchText(inputText)}
          >
            <SearchIcon />
          </button>
        </div>
        <div
          className="c-search-form__autocomplete-container"
          hidden={!autocompleteVisible}
        >
          <GroupedAutocompleteFromSearchTextResults
            id={autocompleteId}
            controlName="Search Suggestions"
            maxElementsPerGroup={5}
            searchFilters={filters}
            searchText={inputText}
            fallbackOption={autocompleteOptionData(inputText, onSubmit)}
            onSelectVehicleOption={onSelectVehicleOption}
            controllerRef={autocompleteController}
              onCursor={{
                onCursorExitEdge: () => formSearchInput.current?.focus(),
              }}
          />
        </div>
      </div>
      <Filters filters={filters} onFiltersChanged={onFiltersChanged} />
    </form>
  )
}

/**
 * {@link SearchForm `SearchForm`} which gets and saves it's state into the
 * {@link StateDispatchContext}.
 */
const SearchFormFromStateDispatchContext = ({
  onSubmit,
  onClear,
  ...props
}: SearchFormEventProps & SearchFormConfigProps) => {
  const [
    {
      searchPageState: { query },
    },
    dispatch,
  ] = useContext(StateDispatchContext)

  const filters = Object.fromEntries(
    Object.entries(query.properties).map(([property, limit]) => [
      property as SearchProperty,
      limit != null,
    ])
  ) as SearchFiltersState

  return (
    <SearchForm
      {...props}
      inputText={query.text}
      filters={filters}
      onInputTextChange={({ currentTarget: { value } }) => {
        dispatch(setSearchText(value))
      }}
      onSubmit={(event) => {
        event.preventDefault()

        dispatch(submitSearch())

        onSubmit?.(event)
      }}
      onClear={(event) => {
        event.preventDefault()
        dispatch(setSearchText(""))
        onClear?.(event)
      }}
      onFiltersChanged={(newFilters) => {
        const newProperties = Object.entries(newFilters)
          .filter(([_property, isActive]) => isActive)
          .map(([property]) => property) as SearchProperty[]

        dispatch(setSearchProperties(newProperties))
        dispatch(submitSearch())
      }}
      onSelectVehicleOption={(vehicle) => {
        dispatch(
          setSelectedEntity({
            type: SelectedEntityType.Vehicle,
            vehicleId: vehicle.id,
          })
        )
      }}
    />
  )
}

export default SearchFormFromStateDispatchContext
