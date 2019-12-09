import React, { useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { setSearchText, submitSearch } from "../models/search"
import { SavedSearchQuery } from "../models/searchQuery"

const RecentSearches = () => {
  const [{ search }, dispatch] = useContext(StateDispatchContext)
  const savedSearches: SavedSearchQuery[] = search.savedSearches
  return (
    <div className="m-recent-searches">
      <div className="m-recent-searches__heading">Recent Searches</div>
      {savedSearches.map((savedSearch, i) => (
        <button
          key={i}
          className="m-recent-searches__button"
          onClick={() => {
            dispatch(setSearchText(savedSearch.text))
            dispatch(submitSearch())
          }}
        >
          {savedSearch.text}
        </button>
      ))}
    </div>
  )
}

export default RecentSearches
