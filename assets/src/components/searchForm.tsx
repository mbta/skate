import React, { useContext, useRef } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { SearchIcon } from "../helpers/icon"
import { CircleXIcon } from "./circleXIcon"
import { FilterAccordion } from "./filterAccordion"
import { isValidSearchQuery, SearchQueryType } from "../models/searchQuery"
import {
  setSearchProperty,
  setSearchText,
  submitSearch,
} from "../state/searchPageState"

type SearchFormProps = {
  onSubmit?: () => void
  onClear?: () => void
  inputTitle?: string
  formTitle?: string
  submitEvent?: string
}

const SearchForm = ({
  onSubmit,
  onClear,
  inputTitle,
  formTitle,
  submitEvent,
}: SearchFormProps) => {
  const [
    {
      searchPageState: { query },
    },
    dispatch,
  ] = useContext(StateDispatchContext)

  const formSearchInput = useRef<HTMLInputElement | null>(null)
  const clearTextInput = (event: React.FormEvent<EventTarget>): void => {
    event.preventDefault()
    dispatch(setSearchText(""))
    // Focus text box after clearing input
    formSearchInput.current?.focus()
    if (onClear) {
      onClear()
    }
  }

  const handleTextInput = (event: React.FormEvent<HTMLInputElement>): void => {
    const value = event.currentTarget.value
    dispatch(setSearchText(value))
  }

  const handlePropertyChange = (value: SearchQueryType): void => {
    dispatch(setSearchProperty(value))
    dispatch(submitSearch())
  }

  const subscribeToSearch = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault()

    submitEvent && window.FS?.event(submitEvent)

    dispatch(submitSearch())
    if (onSubmit) {
      onSubmit()
    }
  }

  return (
    <form
      onSubmit={subscribeToSearch}
      className="c-search-form"
      aria-label={formTitle || "Submit Search"}
    >
      <div className="c-search-form__search-control">
        <div className="c-search-form__search-input-container">
          <input
            type="text"
            className="c-search-form__input"
            placeholder="Search"
            aria-label={inputTitle || "Search"}
            value={query.text}
            onChange={handleTextInput}
            ref={formSearchInput}
          />
        </div>
        <div className="c-search-form__input-controls">
          <button
            hidden={query.text.length === 0}
            type="reset"
            title="Clear Search"
            className="c-search-form__clear c-circle-x-icon-container"
            onClick={clearTextInput}
          >
            <CircleXIcon />
          </button>
          <button
            type="submit"
            title="Submit"
            className="c-search-form__submit"
            onClick={subscribeToSearch}
            // TODO(design): add error states instead of using `disabled`
            disabled={!isValidSearchQuery(query)}
          >
            <SearchIcon />
          </button>
        </div>
      </div>
      <FilterAccordion.WithExpansionState heading="Filter results">
        <FilterAccordion.ToggleFilter
          name={"Vehicles"}
          active={query.property === "vehicle"}
          onClick={() => handlePropertyChange("vehicle")}
        />
        <FilterAccordion.ToggleFilter
          name={"Operators"}
          active={query.property === "operator"}
          onClick={() => handlePropertyChange("operator")}
        />
        <FilterAccordion.ToggleFilter
          name={"Runs"}
          active={query.property === "run"}
          onClick={() => handlePropertyChange("run")}
        />
        <FilterAccordion.ToggleFilter
          name={"Locations"}
          active={false}
          onClick={() => handlePropertyChange("all")}
        />
      </FilterAccordion.WithExpansionState>
    </form>
  )
}

export default SearchForm
