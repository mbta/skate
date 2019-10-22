import React, { useState } from "react"
import { searchIcon } from "../helpers/icon"

const searchProperties = ["all", "run", "vehicle", "operator"]

const SearchForm = () => {
  const [searchText, setSearchText] = useState("")
  const [searchProperty, setSearchProperty] = useState("all")

  const handleTextInput = (event: React.FormEvent<HTMLInputElement>): void =>
    setSearchText(event.currentTarget.value)

  const handlePropertyClick = (
    event: React.FormEvent<HTMLInputElement>
  ): void => setSearchProperty(event.currentTarget.value)

  const subscribeToSearch = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault()
  }

  const formIsSubmittable = (): boolean => searchText.length >= 2

  return (
    <form onSubmit={subscribeToSearch} className="m-search-form">
      <input
        type="text"
        className="m-search-form__text"
        placeholder="Search"
        value={searchText}
        onChange={handleTextInput}
      />

      <button
        className="m-search-form__submit"
        onClick={subscribeToSearch}
        disabled={!formIsSubmittable()}
      >
        {searchIcon()}
      </button>

      <ul className="m-search-form__property-buttons">
        {searchProperties.map(property => (
          <li key={`search-property-${property}`}>
            <input
              id={`property-${property}`}
              className="m-search-form__property-input"
              type="radio"
              name="property"
              value={property}
              checked={searchProperty === property}
              onClick={handlePropertyClick}
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
