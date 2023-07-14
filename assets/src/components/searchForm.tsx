import React, { useContext, useRef } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { SearchIcon } from "../helpers/icon"
import { CircleXIcon } from "./circleXIcon"
import { isValidSearchQuery } from "../models/searchQuery"
import {
  setSearchProperty,
  setSearchText,
  submitSearch,
} from "../state/searchPageState"

const SEARCH_PROPERTIES = ["all", "run", "vehicle", "operator"]

const SearchForm = ({
  onSubmit,
  onClear,
  inputTitle,
  formTitle,
  submitEvent,
}: {
  onSubmit?: () => void
  onClear?: () => void
  inputTitle?: string
  formTitle?: string
  submitEvent?: string
}) => {
  const [
    {
      searchPageState: { query },
    },
    dispatch,
  ] = useContext(StateDispatchContext)
  const handleTextInput = (event: React.FormEvent<HTMLInputElement>): void => {
    const value = event.currentTarget.value
    dispatch(setSearchText(value))
  }

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

  const handlePropertyChange = (
    event: React.FormEvent<HTMLInputElement>
  ): void => {
    dispatch(setSearchProperty(event.currentTarget.value))
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
      </div>

      <div className="c-search-form__row">
        <ul className="c-search-form__property-buttons">
          {SEARCH_PROPERTIES.map((property) => (
            <li
              className="c-search-form__property-button"
              key={`search-property-${property}`}
            >
              <input
                id={`property-${property}`}
                className="c-search-form__property-input"
                type="radio"
                name="property"
                value={property}
                checked={query.property === property}
                onChange={handlePropertyChange}
        />
              <label
                htmlFor={`property-${property}`}
                className="c-search-form__property-label button-search-filter"
              >
                {property}
              </label>
            </li>
          ))}
        </ul>
      </div>
    </form>
  )
}

export default SearchForm
