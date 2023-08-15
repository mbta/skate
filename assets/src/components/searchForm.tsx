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
  SearchPropertyQuery,
  isValidSearchText,
  searchPropertyDisplayConfig,
} from "../models/searchQuery"
import {
  SelectedEntityType,
  setOldSearchProperty,
  setSearchText,
  setSelectedEntity,
  submitSearch,
} from "../state/searchPageState"

import { CircleXIcon } from "./circleXIcon"
import {
  GroupedAutocompleteControls,
  GroupedAutocompleteFromSearchTextEventProps,
  GroupedAutocompleteFromSearchTextResults,
  autocompleteOption,
} from "./groupedAutocomplete"
import { SocketContext } from "../contexts/socketContext"
import useSocket from "../hooks/useSocket"
import { FilterAccordion } from "./filterAccordion"

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
  SearchFormConfigProps &
  GroupedAutocompleteFromSearchTextEventProps & {
    /**
     * Text to show in the search input box.
     */
    inputText: string
    /**
     * Callback to run when {@link inputText} should be updated.
     */
    onInputTextChange?: React.ChangeEventHandler<HTMLInputElement>

    /**
     * The property being searched
     */
    property: SearchPropertyQuery
    /**
     * Callback to run when {@link property} should be updated.
     */
    onPropertyChange: (property: SearchPropertyQuery) => void
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
  selectedProperty,
  onSelectProperty,
}: {
  selectedProperty: SearchPropertyQuery
  onSelectProperty: (property: SearchPropertyQuery) => void
}) => {
  const filters: SearchPropertyQuery[] = [
    "all",
    "vehicle",
    "operator",
    "run",
    "location",
  ]
  return (
    <FilterAccordion.WithExpansionState heading="Filter results">
      {filters.map((property) => (
        <li
          key={`search-property-${property}`}
          className="form-check position-relative lh-base"
        >
          <input
            id={`property-${property}`}
            type="radio"
            className="form-check-input"
            name="property"
            value={property}
            checked={selectedProperty === property}
            onChange={() => onSelectProperty(property as SearchPropertyQuery)}
          />
          <label
            htmlFor={`property-${property}`}
            className="stretched-link form-check-label"
          >
            {property === "all"
              ? "All"
              : searchPropertyDisplayConfig[property].name}
          </label>
        </li>
      ))}
    </FilterAccordion.WithExpansionState>
  )
}

/**
 * Search form which exposes all configurable state and callbacks via {@link SearchFormProps props}.
 */
export const SearchForm = ({
  inputText,
  onInputTextChange,
  property,
  onPropertyChange,
  onClear: onClearProp,
  onSubmit: onSubmitProp,
  onSelectVehicleOption,
  onSelectedLocationId,
  onSelectedLocationText,
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
          <SocketContext.Provider value={useSocket()}>
            <GroupedAutocompleteFromSearchTextResults
              id={autocompleteId}
              controlName="Search Suggestions"
              maxElementsPerGroup={5}
              searchFilters={
                property === "all"
                  ? allFiltersOn
                  : { ...allFiltersOff, [property]: true }
              }
              searchText={inputText}
              fallbackOption={autocompleteOption(inputText, onSubmit)}
              onSelectVehicleOption={onSelectVehicleOption}
              onSelectedLocationId={onSelectedLocationId}
              onSelectedLocationText={(text) => {
                setAutocompleteEnabled(false)
                onSelectedLocationText(text)
              }}
              controllerRef={autocompleteController}
              onCursor={{
                onCursorExitEdge: () => formSearchInput.current?.focus(),
              }}
            />
          </SocketContext.Provider>
        </div>
      </div>
      <Filters
        selectedProperty={property}
        onSelectProperty={onPropertyChange}
      />
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

  return (
    <SearchForm
      {...props}
      inputText={query.text}
      property={query.property}
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
      onPropertyChange={(property: SearchPropertyQuery) => {
        dispatch(setOldSearchProperty(property))
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
      onSelectedLocationId={(id) => {
        dispatch(
          setSelectedEntity({
            type: SelectedEntityType.LocationByPlaceId,
            placeId: id,
          })
        )
      }}
      onSelectedLocationText={(text) => {
        dispatch(setSearchText(text))
        dispatch(submitSearch())
      }}
    />
  )
}

export default SearchFormFromStateDispatchContext
