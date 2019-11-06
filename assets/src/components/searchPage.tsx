import { Socket } from "phoenix"
import React, { ReactElement, useContext } from "react"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useSearchResults from "../hooks/useSearchResults"
import { isValidSearch, Search } from "../models/search"
import { VehicleOrGhost } from "../realtime"
import RecentSearches from "./recentSearches"
import SearchForm from "./searchForm"
import SearchResults from "./searchResults"

const thereIsAnActiveSearch = (
  vehicles: VehicleOrGhost[] | null,
  search: Search
): boolean => vehicles !== null && isValidSearch(search)

const SearchPage = (): ReactElement<HTMLDivElement> => {
  const [{ search }] = useContext(StateDispatchContext)
  const socket: Socket | undefined = useContext(SocketContext)
  const vehicles: VehicleOrGhost[] | null = useSearchResults(socket, search)

  return (
    <div className="c-page m-search-page">
      <div className="m-search-page__controls">
        <SearchForm />
        <div className="m-search-display">
          {thereIsAnActiveSearch(vehicles, search) ? (
            <SearchResults vehicles={vehicles as VehicleOrGhost[]} />
          ) : (
            <RecentSearches />
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchPage
