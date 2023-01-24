import React, { useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { CircleXIcon, SearchIcon } from "../helpers/icon"
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
}: {
  onSubmit?: () => void
  onClear?: () => void
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
    dispatch(setSearchProperty(event.currentTarget.value))
    dispatch(submitSearch())
  }

  const subscribeToSearch = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault()

    dispatch(submitSearch())
    if (onSubmit) {
      onSubmit()
    }
  }

  return (
    <form onSubmit={subscribeToSearch} className="m-search-form">
      <div className="m-search-form__row">
        <div className="m-search-form__text">
          <input
            type="text"
            className="m-search-form__input"
            placeholder="Search"
            value={query.text}
            onChange={handleTextInput}
          />
          <button
            type="reset"
            title="Clear Search"
            className="m-search-form__clear"
            onClick={clearTextInput}
          >
            <CircleXIcon />
          </button>
        </div>

        <button
          type="submit"
          title="Submit"
          className="m-search-form__submit button-submit"
          onClick={subscribeToSearch}
          disabled={!isValidSearchQuery(query)}
        >
          <SearchIcon />
        </button>
      </div>

      <div className="m-search-form__row">
        <ul className="m-search-form__property-buttons">
          {SEARCH_PROPERTIES.map((property) => (
            <li
              className="m-search-form__property-button"
              key={`search-property-${property}`}
            >
              <input
                id={`property-${property}`}
                className="m-search-form__property-input"
                type="radio"
                name="property"
                value={property}
                checked={query.property === property}
                onChange={handlePropertyChange}
              />
              <label
                htmlFor={`property-${property}`}
                className="m-search-form__property-label button-search-filter"
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
