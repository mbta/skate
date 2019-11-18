import React, { useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { searchIcon } from "../helpers/icon"
import {
  isValidSearch,
  setSearchProperty,
  setSearchText,
  submitSearch,
} from "../models/search"

const SEARCH_PROPERTIES = ["all", "run", "vehicle", "operator"]

const SearchForm = () => {
  const [{ search }, dispatch] = useContext(StateDispatchContext)
  const handleTextInput = (event: React.FormEvent<HTMLInputElement>): void =>
    dispatch(setSearchText(event.currentTarget.value))

  const handlePropertyChange = (
    event: React.FormEvent<HTMLInputElement>
  ): void => dispatch(setSearchProperty(event.currentTarget.value))

  const subscribeToSearch = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault()

    dispatch(submitSearch())

    // TODO: Save search results for "recent searches" list:
    // https://app.asana.com/0/1112935048846093/1139512810293672
    // saveSearchResults(searchResults)
  }

  return (
    <form onSubmit={subscribeToSearch} className="m-search-form">
      <div className="m-search-form__row">
        <input
          type="text"
          className="m-search-form__text"
          placeholder="Search"
          value={search.text}
          onChange={handleTextInput}
          autoFocus={true}
        />

        <button
          className="m-search-form__submit"
          onClick={subscribeToSearch}
          disabled={!isValidSearch(search)}
        >
          {searchIcon()}
        </button>
      </div>

      <div className="m-search-form__row">
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
      </div>
    </form>
  )
}

export default SearchForm
