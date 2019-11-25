import { Socket } from "phoenix"
import React, { ReactElement, useContext } from "react"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useSearchResults from "../hooks/useSearchResults"
import { isValidSearch, Search } from "../models/search"
import { isVehicle } from "../models/vehicle"
import { Vehicle, VehicleId, VehicleOrGhost } from "../realtime"
import Map from "./map"
import PropertiesPanel from "./propertiesPanel"
import RecentSearches from "./recentSearches"
import SearchForm from "./searchForm"
import SearchResults from "./searchResults"

const thereIsAnActiveSearch = (
  vehicles: VehicleOrGhost[] | null | undefined,
  search: Search
): boolean =>
  vehicles !== null && vehicles !== undefined && isValidSearch(search)

const onlyVehicles = (
  vehiclesOrGhosts: VehicleOrGhost[] | null | undefined
): Vehicle[] => {
  if (vehiclesOrGhosts === null || vehiclesOrGhosts === undefined) {
    return []
  }

  return vehiclesOrGhosts.filter(vog => isVehicle(vog)) as Vehicle[]
}

const findSelectedVehicle = (
  vehicles: VehicleOrGhost[],
  selectedVehicleId: VehicleId | undefined
): VehicleOrGhost | undefined =>
  vehicles.find(vehicle => vehicle.id === selectedVehicleId)

const SearchPage = (): ReactElement<HTMLDivElement> => {
  const [{ search, selectedVehicleId }] = useContext(StateDispatchContext)
  const socket: Socket | undefined = useContext(SocketContext)
  const vehicles: VehicleOrGhost[] | null | undefined = useSearchResults(
    socket,
    search
  )

  const selectedVehicle: VehicleOrGhost | undefined = findSelectedVehicle(
    vehicles || [],
    selectedVehicleId
  )

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

      <div className="m-search-page__map">
        <Map vehicles={onlyVehicles(vehicles)} />
      </div>

      {selectedVehicle && (
        <PropertiesPanel selectedVehicleOrGhost={selectedVehicle} />
      )}
    </div>
  )
}

export default SearchPage
