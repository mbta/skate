import React, { useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { setSearchText, submitSearch } from "../models/search"
import { SavedSearchQuery } from "../models/searchQuery"

const RecentSearches = () => {
  const [{ search }, dispatch] = useContext(StateDispatchContext)
  const savedQueries: SavedSearchQuery[] = search.savedQueries
  return (
    <div className="m-recent-searches">
      <div className="m-recent-searches__heading">Recent Searches</div>
      {savedQueries.map((savedQuery, i) => (
        <button
          key={i}
          className="m-recent-searches__button"
          onClick={() => {
            dispatch(setSearchText(savedQuery.text))
            dispatch(submitSearch())
          }}
        >
          {savedQuery.text}
        </button>
      ))}
    </div>
  )
}

export default RecentSearches
