import React, {
  MutableRefObject,
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
  SearchQuery,
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
  AutocompleteOptionData,
  GroupedAutocompleteControls,
  GroupedAutocompleteFromSearchTextResults,
  GrouplessAutocompleteFromArray,
  autocompleteOption,
} from "./groupedAutocomplete"
import { SocketContext } from "../contexts/socketContext"
import useSocket from "../hooks/useSocket"
import { FilterAccordion } from "./filterAccordion"
import { Ghost, Vehicle } from "../realtime"
import { ChevronDown } from "../helpers/bsIcons"
import { Dispatch } from "../state"

// #region Search Filters

/**
 * Object describing the current toggle state of the possible
 * {@link SearchProperty}.
 */
export type SearchFiltersState = SearchProperties<boolean>

// #endregion search filters

/**
 * Non-Essential configuration props related to {@link Combobox}.
 */
type ComboboxConfigProps = {
  /**
   * Whether to show the autocomplete box or not
   */
  showAutocomplete?: boolean
}

/**
 * Event props related to {@link Combobox}.
 */
type ComboboxEventProps = {
  /**
   * Callback to run when the form is submitted.
   */
  onSubmit?: React.ReactEventHandler
  /**
   * Callback to run when the form input is cleared via the clear button.
   */
  onClear?: React.ReactEventHandler
}

type ComboboxProps = ComboboxEventProps &
  ComboboxConfigProps & {
    /**
     * Text to show in the search input box.
     */
    inputText: string
    /**
     * Callback to run when {@link inputText} should be updated.
     */
    onInputTextChange?: React.ChangeEventHandler<HTMLInputElement>
  }

type SearchComboboxProps = ComboboxProps & {
  comboboxType: "map_search"
  dispatch: Dispatch
  query: SearchQuery
  options?: undefined
}

type SelectComboboxProps = ComboboxProps & {
  comboboxType: "select"
  dispatch?: undefined
  query?: undefined
  options: AutocompleteOptionData[]
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
  dispatch,
}: {
  selectedProperty: SearchPropertyQuery
  dispatch: Dispatch
}) => {
  const filters: SearchPropertyQuery[] = [
    "all",
    "vehicle",
    "operator",
    "run",
    "location",
  ]
  const onSelectProperty = (property: SearchPropertyQuery) => {
    dispatch(setOldSearchProperty(property))
    dispatch(submitSearch())
  }
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

export const MapSearchCombobox = ({
  autocompleteController,
  autocompleteId,
  dispatch,
  formSearchInput,
  onSubmit,
  query,
  setAutocompleteEnabled,
}: {
  autocompleteController: MutableRefObject<GroupedAutocompleteControls | null>
  autocompleteId: string
  dispatch: Dispatch
  formSearchInput: React.MutableRefObject<HTMLInputElement | null>
  onSubmit: (e: SyntheticEvent) => void
  query: SearchQuery
  setAutocompleteEnabled: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  const onSelectVehicleOption = (vehicle: Vehicle | Ghost) => {
    dispatch(
      setSelectedEntity({
        type: SelectedEntityType.Vehicle,
        vehicleId: vehicle.id,
      })
    )
  }

  const onSelectedLocationId = (id: string) => {
    dispatch(
      setSelectedEntity({
        type: SelectedEntityType.LocationByPlaceId,
        placeId: id,
      })
    )
  }

  const onSelectedLocationText = (text: string) => {
    dispatch(setSearchText(text))
    dispatch(submitSearch())
  }

  return (
    <SocketContext.Provider value={useSocket()}>
      <GroupedAutocompleteFromSearchTextResults
        id={autocompleteId}
        controlName="Search Suggestions"
        maxElementsPerGroup={5}
        searchFilters={
          query.property === "all"
            ? allFiltersOn
            : { ...allFiltersOff, [query.property]: true }
        }
        searchText={query.text}
        fallbackOption={autocompleteOption(query.text, onSubmit)}
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
  )
}

/**
 * Search form which exposes all configurable state and callbacks via {@link ComboboxProps props}.
 */
export const Combobox = ({
  inputText,
  onInputTextChange,
  onClear: onClearProp,
  onSubmit: onSubmitProp,
  comboboxType,
  showAutocomplete: showAutocompleteProp = true,
  dispatch,
  query,
  options,
}: SearchComboboxProps | SelectComboboxProps) => {
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

  const minimumInputLength = comboboxType == "map_search" ? 3 : 0

  const autocompleteVisible =
    autocompleteEnabled &&
    showAutocompleteProp &&
    inputText.length >= minimumInputLength
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
          {comboboxType == "map_search" && (
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
          )}
          {comboboxType == "select" && (
            <button
              type="button"
              // TODO: rename this class (follow-up PR)
              className="c-search-form__submit"
              onClick={onSubmit}
            >
              <ChevronDown />
            </button>
          )}
        </div>
        <div
          className="c-search-form__autocomplete-container"
          hidden={!autocompleteVisible}
        >
          {comboboxType == "map_search" ? (
            <MapSearchCombobox
              autocompleteController={autocompleteController}
              autocompleteId={autocompleteId}
              dispatch={dispatch}
              formSearchInput={formSearchInput}
              onSubmit={onSubmit}
              query={query}
              setAutocompleteEnabled={setAutocompleteEnabled}
            />
          ) : (
            <GrouplessAutocompleteFromArray
              controlName="Search Suggestions"
              fallbackOption={autocompleteOption(
                "No matching routes",
                undefined
              )}
              options={options}
              controllerRef={autocompleteController}
            />
          )}
        </div>
      </div>
      {comboboxType == "map_search" && (
        <Filters selectedProperty={query.property} dispatch={dispatch} />
      )}
    </form>
  )
}

/**
 * {@link Combobox `Combobox`} which gets and saves it's state into the
 * {@link StateDispatchContext}.
 */
const SearchFormFromStateDispatchContext = ({
  onSubmit,
  onClear,
  ...props
}: ComboboxEventProps & ComboboxConfigProps) => {
  const [
    {
      searchPageState: { query },
    },
    dispatch,
  ] = useContext(StateDispatchContext)

  return (
    <Combobox
      {...props}
      inputText={query.text}
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
      comboboxType="map_search"
      dispatch={dispatch}
      query={query}
    />
  )
}

export default SearchFormFromStateDispatchContext
