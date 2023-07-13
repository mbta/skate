import React, { useContext, useRef } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { SearchIcon } from "../helpers/icon"
import { CircleXIcon } from "./circleXIcon"
import { FilterAccordion } from "./filterAccordion"
import { isValidSearchText, OldSearchQueryType } from "../models/searchQuery"
import {
  setOldSearchProperty,
  setSearchText,
  submitSearch,
} from "../state/searchPageState"

// #region Search Filters
/**
 * Unordered enumeration of the UI exposed controls.
 *
 * ---
 *
 * TODO: merge with {@link SearchQueryType}
 */
enum SearchFilters {
  Vehicles,
  Operators,
  Runs,
  Locations,
}

/**
 * Union type of {@link SearchFilters} as strings.
 *
 * Useful for defining objects in terms of possible search filters.
 */
type SearchFilterKeys = keyof typeof SearchFilters

/**
 * Object describing the current toggle state of the possible
 * {@link SearchFilters}.
 */
type SearchFiltersState = {
  [K in SearchFilterKeys]: boolean
}

/**
 * Temporary function to convert {@link SearchFiltersState} to
 * {@link SearchQueryType}.
 *
 * ---
 *
 * This should be removed when {@link SearchFormFromStateDispatchContext} and
 * it's context are refactored to use the new filter requirements.
 */
function filterNameToSearchProperty(
  name: keyof SearchFiltersState
): OldSearchQueryType {
  switch (name) {
    case "Locations":
      return "all"
    case "Operators":
      return "operator"
    case "Runs":
      return "run"
    case "Vehicles":
      return "vehicle"
  }
}
// #endregion search filters

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

type SearchFormProps = SearchFormEventProps & {
  /**
   * Text to show in the search input box.
   */
  inputText: string
  /**
   * Callback to run when {@link inputText} should be updated.
   */
  onInputTextChanged?: React.ChangeEventHandler<HTMLInputElement>

  /**
   * The state of the search filters.
   */
  filters: SearchFiltersState
  /**
   * Callback to run when {@link filters} should be updated.
   */
  onFiltersChanged: (name: SearchFilterKeys, currentValue: boolean) => void
}

/**
 * Search form which exposes all configurable state and callbacks via props.
 */
export const SearchForm = ({
  inputText,
  onInputTextChanged,

  filters,
  onFiltersChanged,

  onClear,
  onSubmit,
}: SearchFormProps) => {
  const formSearchInput = useRef<HTMLInputElement | null>(null)

  return (
    <form onSubmit={onSubmit} className="c-search-form" autoComplete="off">
      <div className="c-search-form__search-control">
        <div className="c-search-form__search-input-container">
          <input
            type="text"
            className="c-search-form__input"
            placeholder="Search"
            value={inputText}
            onChange={onInputTextChanged}
            ref={formSearchInput}
          />
          <div className="c-search-form__input-controls">
            <button
              hidden={inputText.length === 0}
              className="c-search-form__clear c-circle-x-icon-container"
              type="button"
              title="Clear Search"
              onClick={(e) => {
                // Set focus on input after input is cleared
                formSearchInput.current?.focus()
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
        </div>
      </div>
      <FilterAccordion.WithExpansionState heading="Filter results">
        <FilterAccordion.ToggleFilter
          name={"Vehicles"}
          active={filters.Vehicles}
          onClick={() => onFiltersChanged("Vehicles", filters.Vehicles)}
        />
        <FilterAccordion.ToggleFilter
          name={"Operators"}
          active={filters.Operators}
          onClick={() => onFiltersChanged("Operators", filters.Operators)}
        />
        <FilterAccordion.ToggleFilter
          name={"Runs"}
          active={filters.Runs}
          onClick={() => onFiltersChanged("Runs", filters.Runs)}
        />
        <FilterAccordion.ToggleFilter
          name={"Locations"}
          active={filters.Locations}
          onClick={() => onFiltersChanged("Locations", filters.Locations)}
        />
      </FilterAccordion.WithExpansionState>
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
}: SearchFormEventProps) => {
  const [
    {
      searchPageState: { query },
    },
    dispatch,
  ] = useContext(StateDispatchContext)

  return (
    <SearchForm
      inputText={query.text}
      filters={{
        Locations: query.property === "all",
        Operators: query.property === "operator",
        Runs: query.property === "run",
        Vehicles: query.property === "vehicle",
      }}
      onInputTextChanged={({ currentTarget: { value } }) => {
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
      onFiltersChanged={(name, _) => {
        dispatch(setOldSearchProperty(filterNameToSearchProperty(name)))
        dispatch(submitSearch())
      }}
    />
  )
}

export default SearchFormFromStateDispatchContext
