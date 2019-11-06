import { Socket } from "phoenix"
import React, { ReactElement, useContext } from "react"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useSearchResults from "../hooks/useSearchResults"
import { VehicleOrGhost } from "../realtime"
import RecentSearches from "./recentSearches"
import SearchForm from "./searchForm"

const SearchPage = (): ReactElement<HTMLDivElement> => {
  const socket: Socket | undefined = useContext(SocketContext)
  const [{ search }] = useContext(StateDispatchContext)
  const vehicles: VehicleOrGhost[] | null = useSearchResults(socket, search)

  return (
    <div className="c-page m-search-page">
      <div className="m-search-controls">
        <SearchForm />
        {vehicles ? (
          <div className="m-search-results">
            {vehicles && `Number of results: ${vehicles.length}`}
          </div>
        ) : (
          <RecentSearches />
        )}
      </div>
    </div>
  )
}

export default SearchPage
