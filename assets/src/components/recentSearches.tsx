import React, { useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { setSearchText, submitSearch } from "../state/searchPageState"

const RecentSearches = () => {
  const [
    {
      searchPageState: { savedQueries },
    },
    dispatch,
  ] = useContext(StateDispatchContext)
  return (
    <div className="m-recent-searches">
      <div className="m-recent-searches__heading">Recent Searches</div>
      <ul>
        {savedQueries.map((savedQuery, i) => (
          <li key={i}>
            <button
              className="m-recent-searches__button"
              onClick={() => {
                dispatch(setSearchText(savedQuery.text))
                dispatch(submitSearch())
              }}
            >
              {savedQuery.text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default RecentSearches
