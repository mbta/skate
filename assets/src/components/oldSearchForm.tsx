import React, { useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { CircleXIcon, SearchIcon } from "../helpers/icon"
import { isValidSearchQuery } from "../models/searchQuery"
import {
  setOldSearchProperty,
  setSearchText,
  submitSearch,
} from "../state/searchPageState"

const SEARCH_PROPERTIES = ["all", "run", "vehicle", "operator"]

const OldSearchForm = ({
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

  const clearTextInput = (event: React.FormEvent<EventTarget>): void => {
    event.preventDefault()
    dispatch(setSearchText(""))
    if (onClear) {
      onClear()
    }
  }

  const handlePropertyChange = (
    event: React.FormEvent<HTMLInputElement>
  ): void => {
    dispatch(setOldSearchProperty(event.currentTarget.value))
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
      className="c-old-search-form"
      aria-label={formTitle || "Submit Search"}
    >
      <div className="c-old-search-form__row">
        <div className="c-old-search-form__text">
          <input
            type="text"
            className="c-old-search-form__input"
            placeholder="Search"
            aria-label={inputTitle || "Search"}
            value={query.text}
            onChange={handleTextInput}
          />
          <button
            type="reset"
            title="Clear Search"
            className="c-old-search-form__clear"
            onClick={clearTextInput}
          >
            <CircleXIcon />
          </button>
        </div>

        <button
          type="submit"
          title="Submit"
          className="c-old-search-form__submit button-submit"
          onClick={subscribeToSearch}
          disabled={!isValidSearchQuery(query)}
        >
          <SearchIcon />
        </button>
      </div>

      <div className="c-old-search-form__row">
        <ul className="c-old-search-form__property-buttons">
          {SEARCH_PROPERTIES.map((property) => (
            <li
              className="c-old-search-form__property-button"
              key={`search-property-${property}`}
            >
              <input
                id={`property-${property}`}
                className="c-old-search-form__property-input"
                type="radio"
                name="property"
                value={property}
                checked={query.property === property}
                onChange={handlePropertyChange}
              />
              <label
                htmlFor={`property-${property}`}
                className="c-old-search-form__property-label button-search-filter"
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

export default OldSearchForm
