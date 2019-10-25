import { Socket } from "phoenix"
import React, { ReactElement, useContext, useReducer } from "react"
import { SocketContext } from "../contexts/socketContext"
import useSearchResults from "../hooks/useSearchResults"
import { initialSearch, reducer } from "../models/search"
import { VehicleOrGhost } from "../realtime"
import SearchForm from "./searchForm"

const SearchPage = (): ReactElement<HTMLDivElement> => {
  const socket: Socket | undefined = useContext(SocketContext)
  const [search, dispatch] = useReducer(reducer, initialSearch)
  const vehicles: VehicleOrGhost[] | null = useSearchResults(socket, search)

  return (
    <div className="c-page">
      <SearchForm search={search} dispatch={dispatch} />
      <div className="m-search-results">
        {vehicles && `Number of results: ${vehicles.length}`}
      </div>
    </div>
  )
}

export default SearchPage
