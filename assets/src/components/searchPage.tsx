import { Socket } from "phoenix"
import React, { ReactElement, useContext } from "react"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useSearchResults from "../hooks/useSearchResults"
import { VehicleOrGhost } from "../realtime"
import SearchForm from "./searchForm"

const SearchPage = (): ReactElement<HTMLDivElement> => {
  const socket: Socket | undefined = useContext(SocketContext)
  const [{ search }] = useContext(StateDispatchContext)
  const vehicles: VehicleOrGhost[] | null = useSearchResults(socket, search)

  return (
    <div className="c-page">
      <SearchForm />
      <div className="m-search-results">
        {vehicles && `Number of results: ${vehicles.length}`}
      </div>
    </div>
  )
}

export default SearchPage
