import React from "react"
import { searchIcon } from "../helpers/icon"
import {
  Dispatch,
  isValidSearch,
  Search,
  setSearchProperty,
  setSearchText,
} from "../models/search"

interface Props {
  search: Search
  dispatch: Dispatch
}

const SEARCH_PROPERTIES = ["all", "run", "vehicle", "operator"]

const SearchForm = ({ search, dispatch }: Props) => {
  const handleTextInput = (event: React.FormEvent<HTMLInputElement>): void =>
    dispatch(setSearchText(event.currentTarget.value))

  const handlePropertyChange = (
    event: React.FormEvent<HTMLInputElement>
  ): void => dispatch(setSearchProperty(event.currentTarget.value))

  const subscribeToSearch = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault()

    // TODO: Save search results for "recent searches" list:
    // https://app.asana.com/0/1112935048846093/1139512810293672
    // saveSearchResults(searchResults)
  }

  return (
    <form onSubmit={subscribeToSearch} className="m-search-form">
      <input
        type="text"
        className="m-search-form__text"
        placeholder="Search"
        value={search.text}
        onChange={handleTextInput}
      />

      <button
        className="m-search-form__submit"
        onClick={subscribeToSearch}
        disabled={!isValidSearch(search)}
      >
        {searchIcon()}
      </button>

      <ul className="m-search-form__property-buttons">
        {SEARCH_PROPERTIES.map(property => (
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
              checked={search.property === property}
              onChange={handlePropertyChange}
            />
            <label
              htmlFor={`property-${property}`}
              className="m-search-form__property-label"
            >
              {property}
            </label>
          </li>
        ))}
      </ul>
    </form>
  )
}

export default SearchForm
