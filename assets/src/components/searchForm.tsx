import React, { useContext, useRef, useState } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { SearchIcon } from "../helpers/icon"
import { CircleXIcon } from "./circleXIcon"
import { FilterAccordion } from "./filterAccordion"
import {
  isValidSearchText,
  SearchProperty,
  searchPropertyDisplayConfig,
} from "../models/searchQuery"
import {
  setSearchProperties,
  setSearchText,
  submitSearch,
} from "../state/searchPageState"

// #region Search Filters

/**
 * Object describing the current toggle state of the possible
 * {@link SearchProperty}.
 */
type SearchFiltersState = {
  [K in SearchProperty]: boolean
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
  onFiltersChanged: (searchFilterState: SearchFiltersState) => void
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
}: SearchFormEventProps) => {
  const [
    {
      searchPageState: { query },
    },
    dispatch,
  ] = useContext(StateDispatchContext)

  const filters = Object.fromEntries(
    Object.entries(query.properties).map(([property, limit]) => [
      property as SearchProperty,
      limit > 0,
    ])
  ) as SearchFiltersState

  return (
    <SearchForm
      inputText={query.text}
      filters={filters}
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
      onFiltersChanged={(newFilters) => {
        const newProperties = Object.entries(newFilters)
          .filter(([_property, isActive]) => isActive)
          .map(([property]) => property) as SearchProperty[]

        dispatch(setSearchProperties(newProperties))
        dispatch(submitSearch())
      }}
    />
  )
}

export default SearchFormFromStateDispatchContext
